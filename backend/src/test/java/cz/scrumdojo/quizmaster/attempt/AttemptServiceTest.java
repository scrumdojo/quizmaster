package cz.scrumdojo.quizmaster.attempt;

import static org.assertj.core.api.Assertions.assertThat;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionAnswerRequest;
import cz.scrumdojo.quizmaster.quiz.Cohort;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizMode;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class AttemptServiceTest {

    @Autowired
    private AttemptService service;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private AttemptQuestionRepository attemptQuestionRepository;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void timeoutStampsTimedOutAtAndPersists() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);
        LocalDateTime now = LocalDateTime.of(2026, 5, 14, 10, 30);

        service.timeout(attempt, now);

        Attempt reloaded = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertThat(reloaded.getTimedOutAt()).isEqualTo(now);
        assertThat(reloaded.getFinishedAt()).isNull();
    }

    @Test
    public void finishMarksAttemptFinished() {
        Question q1 = fixtures.save(fixtures.question());
        Question q2 = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), q1, q2);
        fixtures.score(attempt, q1, AnswerStatus.CORRECT);
        fixtures.score(attempt, q2, AnswerStatus.PARTIAL);
        LocalDateTime now = LocalDateTime.of(2026, 5, 14, 10, 30);

        service.finish(attempt, now);

        Attempt reloaded = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertThat(reloaded.getFinishedAt()).isEqualTo(now);
    }

    @Test
    public void answeredQuestionsReturnsRowsInPositionOrder() {
        Question q1 = fixtures.save(fixtures.question());
        Question q2 = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), q1, q2);
        fixtures.score(attempt, q1, AnswerStatus.CORRECT);
        fixtures.score(attempt, q2, AnswerStatus.PARTIAL);

        var rows = service.answeredQuestions(attempt.getId());

        assertThat(rows).extracting(AttemptQuestion::getQuestionId).containsExactly(q1.getId(), q2.getId());
        assertThat(AttemptQuestion.totalPoints(rows)).isEqualTo(1.5);
    }

    @Test
    public void answeredQuestionsForAttemptWithoutDrawnQuestionsIsEmpty() {
        Quiz quiz = fixtures.save(fixtures.quiz());
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz));

        assertThat(service.answeredQuestions(attempt.getId())).isEmpty();
    }

    @Test
    public void submitAnswerScoresChoiceQuestionAndPersistsOutcome() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question).mode(QuizMode.EXAM));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);
        LocalDateTime now = LocalDateTime.of(2026, 5, 14, 10, 30);
        QuestionAnswerRequest correctAnswer = new QuestionAnswerRequest(null, "choice", new int[] { 1 }, null);

        AttemptQuestion attemptQuestion = attemptQuestionRepository
            .findByAttemptIdAndQuestionId(attempt.getId(), question.getId())
            .orElseThrow();
        AnswerStatus status = service.submitAnswer(quiz, attemptQuestion, question, correctAnswer, now);

        assertThat(status).isEqualTo(AnswerStatus.CORRECT);
        var row = attemptQuestionRepository
            .findByAttemptIdAndQuestionId(attempt.getId(), question.getId())
            .orElseThrow();
        assertThat(row.getStatus()).isEqualTo(AnswerStatus.CORRECT);
        assertThat(row.getAnsweredAt()).isEqualTo(now);
    }

    @Test
    public void submitAnswerInLearnModeKeepsFirstOutcomeOnRetake() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question).mode(QuizMode.LEARN));
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);
        QuestionAnswerRequest wrongAnswer = new QuestionAnswerRequest(null, "choice", new int[] { 0 }, null);
        QuestionAnswerRequest correctAnswer = new QuestionAnswerRequest(null, "choice", new int[] { 1 }, null);
        AttemptQuestion attemptQuestion = attemptQuestionRepository
            .findByAttemptIdAndQuestionId(attempt.getId(), question.getId())
            .orElseThrow();

        service.submitAnswer(quiz, attemptQuestion, question, wrongAnswer, LocalDateTime.now());
        service.submitAnswer(quiz, attemptQuestion, question, correctAnswer, LocalDateTime.now());

        var row = attemptQuestionRepository
            .findByAttemptIdAndQuestionId(attempt.getId(), question.getId())
            .orElseThrow();
        assertThat(row.getStatus()).isEqualTo(AnswerStatus.INCORRECT);
    }

    @Test
    public void startDrawsQuestionsAndCreatesAttemptQuestionRowsInPositionOrder() {
        Question q1 = fixtures.save(fixtures.question());
        Question q2 = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2).randomQuestionCount(null));
        LocalDateTime now = LocalDateTime.of(2026, 5, 14, 10, 0);

        AttemptStart started = service.start(quiz, null, null, false, now);

        assertThat(started.attempt().getStartedAt()).isEqualTo(now);
        assertThat(started.drawnQuestions()).extracting(Question::getId).containsExactly(q1.getId(), q2.getId());
        var rows = attemptQuestionRepository.findByAttemptIdOrderByPosition(started.attempt().getId());
        assertThat(rows).hasSize(2);
        assertThat(rows.get(0).getQuestionId()).isEqualTo(q1.getId());
        assertThat(rows.get(0).getPosition()).isEqualTo(0);
        assertThat(rows.get(0).getStatus()).isEqualTo(AnswerStatus.UNANSWERED);
        assertThat(rows.get(1).getQuestionId()).isEqualTo(q2.getId());
        assertThat(rows.get(1).getPosition()).isEqualTo(1);
    }

    @Test
    public void startWithRandomQuestionCountLimitsDrawnQuestions() {
        Question q1 = fixtures.save(fixtures.question());
        Question q2 = fixtures.save(fixtures.question());
        Question q3 = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(q1, q2, q3).randomQuestionCount(2));

        AttemptStart started = service.start(quiz, null, null, false, LocalDateTime.now());

        assertThat(started.drawnQuestions()).hasSize(2);
        assertThat(attemptQuestionRepository.findByAttemptIdOrderByPosition(started.attempt().getId())).hasSize(2);
    }

    @Test
    public void startWithCohortPersistsCohortGuid() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(question)
                .randomQuestionCount(null)
                .cohorts(List.of(Cohort.builder().name("Alpha").build()))
                .build()
        );
        Cohort cohort = quiz.getCohorts().getFirst();

        AttemptStart started = service.start(quiz, cohort, null, false, LocalDateTime.now());

        assertThat(started.attempt().getCohortGuid()).isEqualTo(cohort.getGuid());
    }

    @Test
    public void startWithoutCohortLeavesCohortGuidNull() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question).randomQuestionCount(null));

        AttemptStart started = service.start(quiz, null, null, false, LocalDateTime.now());

        assertThat(started.attempt().getCohortGuid()).isNull();
    }

    @Test
    public void startWithIsDryRunFlagsAttempt() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question).randomQuestionCount(null));

        AttemptStart started = service.start(quiz, null, null, true, LocalDateTime.now());

        assertThat(started.attempt().getIsDryRun()).isTrue();
    }

    @Test
    public void startWithNicknamePersistsNickname() {
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(fixtures.quiz(question).randomQuestionCount(null));

        AttemptStart started = service.start(quiz, null, "Quiz Falcon", false, LocalDateTime.now());

        assertThat(started.attempt().getNickname()).isEqualTo("Quiz Falcon");
    }
}
