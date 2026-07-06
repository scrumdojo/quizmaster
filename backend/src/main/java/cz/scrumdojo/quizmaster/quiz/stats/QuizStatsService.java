package cz.scrumdojo.quizmaster.quiz.stats;

import cz.scrumdojo.quizmaster.attempt.AnswerStatus;
import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestion;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptStatus;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import cz.scrumdojo.quizmaster.quiz.QuizService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuizStatsService {

    private static final String UNTAGGED = "Untagged";

    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;
    private final AttemptQuestionRepository attemptQuestionRepository;
    private final QuizService quizService;

    public QuizStatsService(
        QuizRepository quizRepository,
        AttemptRepository attemptRepository,
        AttemptQuestionRepository attemptQuestionRepository,
        QuizService quizService
    ) {
        this.quizRepository = quizRepository;
        this.attemptRepository = attemptRepository;
        this.attemptQuestionRepository = attemptQuestionRepository;
        this.quizService = quizService;
    }

    @Transactional(readOnly = true)
    public Optional<QuizStatsResponse> getStats(String workspaceGuid, Integer quizId) {
        return quizRepository
            .findByIdAndWorkspaceGuid(quizId, workspaceGuid)
            .map(quiz -> {
                List<Attempt> attempts = attemptRepository.findByQuizIdAndIsDryRunFalseOrderByStartedAtDesc(quizId);
                List<Integer> attemptIds = attempts.stream().map(Attempt::getId).toList();
                List<AttemptQuestion> allScores = attemptIds.isEmpty()
                    ? List.of()
                    : attemptQuestionRepository.findByAttemptIdInOrderByPosition(attemptIds);
                Map<Integer, List<AttemptQuestion>> scoresByAttemptId = allScores
                    .stream()
                    .collect(Collectors.groupingBy(AttemptQuestion::getAttemptId));
                List<AttemptStatsRecord> attemptRecords = attempts
                    .stream()
                    .map(attempt ->
                        toAttemptRecord(quiz, attempt, scoresByAttemptId.getOrDefault(attempt.getId(), List.of()))
                    )
                    .toList();
                SummaryStats summary = computeSummary(attemptRecords);
                List<Question> questions = quizService.loadQuestions(quiz);
                Map<Integer, List<AttemptQuestion>> scoresByQuestionId = allScores
                    .stream()
                    .collect(Collectors.groupingBy(AttemptQuestion::getQuestionId));
                List<QuestionStatsRecord> questionRecords = buildQuestionRecords(questions, scoresByQuestionId);
                List<TagStatsRecord> tagRecords = buildTagRecords(questions, scoresByQuestionId);
                return new QuizStatsResponse(summary, attemptRecords, questionRecords, tagRecords);
            });
    }

    private List<QuestionStatsRecord> buildQuestionRecords(
        List<Question> questions,
        Map<Integer, List<AttemptQuestion>> scoresByQuestionId
    ) {
        return questions
            .stream()
            .map(question -> toQuestionRecord(question, scoresByQuestionId.getOrDefault(question.getId(), List.of())))
            .toList();
    }

    private QuestionStatsRecord toQuestionRecord(Question question, List<AttemptQuestion> scores) {
        AnswerCounts counts = countAnswers(scores);
        int flagged = (int) scores.stream().filter(AttemptQuestion::isFlagged).count();
        return new QuestionStatsRecord(
            question.getQuestion(),
            counts.answered(),
            counts.correct(),
            counts.partiallyCorrect(),
            counts.incorrect(),
            counts.unanswered(),
            flagged
        );
    }

    private List<TagStatsRecord> buildTagRecords(
        List<Question> questions,
        Map<Integer, List<AttemptQuestion>> scoresByQuestionId
    ) {
        Map<String, List<Question>> questionsByTag = new HashMap<>();
        List<Question> untaggedQuestions = new ArrayList<>();
        for (Question question : questions) {
            String[] tags = question.getTags() == null ? new String[0] : question.getTags();
            if (tags.length == 0) {
                untaggedQuestions.add(question);
                continue;
            }
            for (String tag : tags) {
                questionsByTag.computeIfAbsent(tag, t -> new ArrayList<>()).add(question);
            }
        }
        if (questionsByTag.isEmpty()) {
            return List.of();
        }
        if (!untaggedQuestions.isEmpty()) {
            questionsByTag.put(UNTAGGED, untaggedQuestions);
        }
        return questionsByTag
            .entrySet()
            .stream()
            .map(entry -> toTagRecord(entry.getKey(), entry.getValue(), scoresByQuestionId))
            .sorted(
                Comparator.comparing((TagStatsRecord record) -> UNTAGGED.equals(record.tag()))
                    .thenComparingDouble(QuizStatsService::accuracy)
                    .thenComparing(TagStatsRecord::tag)
            )
            .toList();
    }

    private TagStatsRecord toTagRecord(
        String tag,
        List<Question> tagQuestions,
        Map<Integer, List<AttemptQuestion>> scoresByQuestionId
    ) {
        List<AttemptQuestion> scores = tagQuestions
            .stream()
            .flatMap(question -> scoresByQuestionId.getOrDefault(question.getId(), List.<AttemptQuestion>of()).stream())
            .toList();
        AnswerCounts counts = countAnswers(scores);
        return new TagStatsRecord(
            tag,
            tagQuestions.size(),
            counts.answered(),
            counts.correct(),
            counts.partiallyCorrect(),
            counts.incorrect(),
            counts.unanswered()
        );
    }

    private static double accuracy(TagStatsRecord record) {
        return record.answered() == 0 ? 0 : (double) record.correctAnswers() / record.answered();
    }

    private record AnswerCounts(int answered, int correct, int partiallyCorrect, int incorrect, int unanswered) {}

    private AnswerCounts countAnswers(List<AttemptQuestion> scores) {
        List<AttemptQuestion> answeredScores = scores
            .stream()
            .filter(s -> s.getStatus() != AnswerStatus.UNANSWERED)
            .toList();
        return new AnswerCounts(
            answeredScores.size(),
            countByStatus(answeredScores, AnswerStatus.CORRECT),
            countByStatus(answeredScores, AnswerStatus.PARTIAL),
            countByStatus(answeredScores, AnswerStatus.INCORRECT),
            scores.size() - answeredScores.size()
        );
    }

    private int countByStatus(List<AttemptQuestion> scores, AnswerStatus status) {
        return (int) scores
            .stream()
            .filter(s -> s.getStatus() == status)
            .count();
    }

    private AttemptStatsRecord toAttemptRecord(Quiz quiz, Attempt attempt, List<AttemptQuestion> scores) {
        int totalQuestions = scores.size();
        int correctAnswers = countByStatus(scores, AnswerStatus.CORRECT);
        int partiallyCorrectAnswers = countByStatus(scores, AnswerStatus.PARTIAL);
        int incorrectAnswers =
            attempt.getFinishedAt() != null
                ? totalQuestions - correctAnswers - partiallyCorrectAnswers
                : countByStatus(scores, AnswerStatus.INCORRECT);
        int[] weights = scores
            .stream()
            .mapToInt(row -> quiz.weightForQuestion(row.getQuestionId()))
            .toArray();
        return new AttemptStatsRecord(
            attempt.getId(),
            attempt.durationSeconds(quiz.getTimeLimit()),
            correctAnswers,
            incorrectAnswers,
            partiallyCorrectAnswers,
            totalQuestions,
            AttemptQuestion.weightedPercentageScore(scores, weights),
            attempt.status()
        );
    }

    private SummaryStats computeSummary(List<AttemptStatsRecord> records) {
        int started = records.size();
        int finished = (int) records
            .stream()
            .filter(r -> r.status() == AttemptStatus.FINISHED)
            .count();
        int timeout = (int) records
            .stream()
            .filter(r -> r.status() == AttemptStatus.TIMEOUT)
            .count();
        int unfinished = started - finished - timeout;
        return new SummaryStats(started, finished, unfinished, timeout);
    }
}
