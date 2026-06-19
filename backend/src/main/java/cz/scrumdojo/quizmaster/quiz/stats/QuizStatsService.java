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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuizStatsService {

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
                List<QuestionStatsRecord> questionRecords = buildQuestionRecords(quiz, allScores);
                return new QuizStatsResponse(summary, attemptRecords, questionRecords);
            });
    }

    private List<QuestionStatsRecord> buildQuestionRecords(Quiz quiz, List<AttemptQuestion> allScores) {
        List<Question> questions = quizService.loadQuestions(quiz);
        if (questions.isEmpty()) {
            return List.of();
        }
        Map<Integer, List<AttemptQuestion>> scoresByQuestionId = allScores
            .stream()
            .collect(Collectors.groupingBy(AttemptQuestion::getQuestionId));
        return questions
            .stream()
            .map(question -> {
                var rows = scoresByQuestionId.getOrDefault(question.getId(), List.of());
                return toQuestionRecord(question, rows.size(), rows);
            })
            .toList();
    }

    private QuestionStatsRecord toQuestionRecord(Question question, int drawCount, List<AttemptQuestion> scores) {
        List<AttemptQuestion> answeredScores = scores
            .stream()
            .filter(s -> s.getStatus() != AnswerStatus.UNANSWERED)
            .toList();
        int answered = answeredScores.size();
        int unanswered = drawCount - answered;
        int correctAnswers = countByStatus(answeredScores, AnswerStatus.CORRECT);
        int partiallyCorrectAnswers = countByStatus(answeredScores, AnswerStatus.PARTIAL);
        int incorrectAnswers = countByStatus(answeredScores, AnswerStatus.INCORRECT);
        return new QuestionStatsRecord(
            question.getQuestion(),
            answered,
            correctAnswers,
            partiallyCorrectAnswers,
            incorrectAnswers,
            unanswered
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
        int[] weights = scores.stream().mapToInt(row -> quiz.weightForQuestion(row.getQuestionId())).toArray();
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
