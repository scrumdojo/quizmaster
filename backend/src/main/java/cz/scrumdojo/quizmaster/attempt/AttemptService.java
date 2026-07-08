package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionAnswerRequest;
import cz.scrumdojo.quizmaster.question.QuestionScoringService;
import cz.scrumdojo.quizmaster.quiz.Cohort;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizMode;
import cz.scrumdojo.quizmaster.quiz.QuizService;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttemptService {

    private static final int BUZZER_COUNTDOWN_SECONDS = 10;

    private final AttemptRepository attemptRepository;
    private final AttemptQuestionRepository attemptQuestionRepository;
    private final QuestionScoringService questionScoringService;
    private final QuizService quizService;

    public AttemptService(
        AttemptRepository attemptRepository,
        AttemptQuestionRepository attemptQuestionRepository,
        QuestionScoringService questionScoringService,
        QuizService quizService
    ) {
        this.attemptRepository = attemptRepository;
        this.attemptQuestionRepository = attemptQuestionRepository;
        this.questionScoringService = questionScoringService;
        this.quizService = quizService;
    }

    @Transactional
    public AttemptStart start(Quiz quiz, Cohort cohort, String nickname, boolean isDryRun, LocalDateTime now) {
        Attempt persisted = attemptRepository.save(
            Attempt.builder()
                .quizId(quiz.getId())
                .cohortGuid(cohort == null ? null : cohort.getGuid())
                .nickname(nickname)
                .startedAt(now)
                .isDryRun(isDryRun)
                .build()
        );
        List<Question> drawnQuestions = quizService.drawQuestions(quiz);
        for (int position = 0; position < drawnQuestions.size(); position++) {
            attemptQuestionRepository.save(
                AttemptQuestion.drawn(persisted.getId(), drawnQuestions.get(position).getId(), position)
            );
        }
        return new AttemptStart(persisted, drawnQuestions);
    }

    public Optional<Attempt> findAttempt(Integer quizId, Integer attemptId) {
        return attemptRepository.findByIdAndQuizId(attemptId, quizId);
    }

    public Optional<AttemptQuestion> findAttemptQuestion(Integer attemptId, Integer questionId) {
        return attemptQuestionRepository.findByAttemptIdAndQuestionId(attemptId, questionId);
    }

    public List<AttemptQuestion> answeredQuestions(Integer attemptId) {
        return attemptQuestionRepository.findByAttemptIdOrderByPosition(attemptId);
    }

    @Transactional
    public AnswerStatus submitAnswer(
        Quiz quiz,
        AttemptQuestion attemptQuestion,
        Question question,
        QuestionAnswerRequest request,
        LocalDateTime now
    ) {
        AnswerStatus status = questionScoringService.score(question, request);
        attemptQuestion.recordOutcome(quiz.getMode(), status, now);
        attemptQuestionRepository.save(attemptQuestion);
        return status;
    }

    @Transactional
    public void finish(Attempt attempt, LocalDateTime now) {
        attempt.markFinished(now);
        attemptRepository.save(attempt);
    }

    @Transactional
    public void setFlag(AttemptQuestion attemptQuestion, boolean flagged) {
        attemptQuestion.setFlagged(flagged);
        attemptQuestionRepository.save(attemptQuestion);
    }

    @Transactional
    public void timeout(Attempt attempt, LocalDateTime now) {
        attempt.markTimedOut(now);
        attemptRepository.save(attempt);
    }

    public BuzzerStatus buzzerStatus(Quiz quiz, LocalDateTime now) {
        if (quiz.getMode() != QuizMode.BUZZER) {
            return BuzzerStatus.started();
        }

        List<Attempt> attempts = attemptRepository.findByQuizIdAndIsDryRunFalseOrderByStartedAtAscIdAsc(quiz.getId());
        LocalDateTime secondCohortJoinedAt = secondDistinctCohortJoinTime(attempts);
        if (secondCohortJoinedAt == null) {
            return BuzzerStatus.waiting();
        }

        LocalDateTime countdownEndsAt = secondCohortJoinedAt.plusSeconds(BUZZER_COUNTDOWN_SECONDS);
        if (!now.isBefore(countdownEndsAt)) {
            return BuzzerStatus.started();
        }

        long millisRemaining = Duration.between(now, countdownEndsAt).toMillis();
        return BuzzerStatus.countdown((int) Math.ceil(millisRemaining / 1000.0));
    }

    private static LocalDateTime secondDistinctCohortJoinTime(List<Attempt> attemptsByStartedAtAsc) {
        Set<String> seenCohorts = new LinkedHashSet<>();
        for (Attempt attempt : attemptsByStartedAtAsc) {
            String cohortGuid = attempt.getCohortGuid();
            if (cohortGuid == null || !seenCohorts.add(cohortGuid)) continue;
            if (seenCohorts.size() == 2) return attempt.getStartedAt();
        }
        return null;
    }
}
