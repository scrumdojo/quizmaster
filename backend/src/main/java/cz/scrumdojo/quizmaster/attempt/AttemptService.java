package cz.scrumdojo.quizmaster.attempt;

import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionAnswerRequest;
import cz.scrumdojo.quizmaster.question.QuestionScoringService;
import cz.scrumdojo.quizmaster.quiz.Cohort;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttemptService {

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
    public void timeout(Attempt attempt, LocalDateTime now) {
        attempt.markTimedOut(now);
        attemptRepository.save(attempt);
    }
}
