package cz.scrumdojo.quizmaster.question;

import static org.assertj.core.api.Assertions.assertThat;

import cz.scrumdojo.quizmaster.attempt.AnswerStatus;
import org.junit.jupiter.api.Test;

class QuestionScoringServiceTest {

    private final QuestionScoringService service = new QuestionScoringService();

    @Test
    void numericalExactMatchIsCorrect() {
        assertThat(service.score(numerical("3.14", null), value(3.14))).isEqualTo(AnswerStatus.CORRECT);
    }

    @Test
    void numericalWithinToleranceIsCorrect() {
        assertThat(service.score(numerical("3.14", 0.01), value(3.13))).isEqualTo(AnswerStatus.CORRECT);
        assertThat(service.score(numerical("3.14", 0.01), value(3.15))).isEqualTo(AnswerStatus.CORRECT);
    }

    @Test
    void numericalAtToleranceBoundaryIsCorrect() {
        // 3.14 + 0.01 carries IEEE-754 noise; the epsilon in the service absorbs it.
        assertThat(service.score(numerical("3.14", 0.01), value(3.14 + 0.01))).isEqualTo(AnswerStatus.CORRECT);
        assertThat(service.score(numerical("3.14", 0.01), value(3.14 - 0.01))).isEqualTo(AnswerStatus.CORRECT);
    }

    @Test
    void numericalJustOutsideToleranceIsIncorrect() {
        assertThat(service.score(numerical("3.14", 0.01), value(3.16))).isEqualTo(AnswerStatus.INCORRECT);
        assertThat(service.score(numerical("3.14", 0.01), value(3.12))).isEqualTo(AnswerStatus.INCORRECT);
    }

    @Test
    void numericalWithoutToleranceRejectsApproximateAnswer() {
        assertThat(service.score(numerical("56", null), value(57.0))).isEqualTo(AnswerStatus.INCORRECT);
        assertThat(service.score(numerical("56", 0.0), value(56.0))).isEqualTo(AnswerStatus.CORRECT);
    }

    @Test
    void numericalWithNullAnswerValueIsIncorrect() {
        assertThat(
            service.score(numerical("3.14", 0.01), new QuestionAnswerRequest(null, "numerical", null, null))
        ).isEqualTo(AnswerStatus.INCORRECT);
    }

    @Test
    void numericalWithEmptyQuestionAnswersIsIncorrect() {
        Question question = Question.builder()
            .questionType(QuestionType.NUMERICAL)
            .answers(new String[] {})
            .tolerance(0.0)
            .build();
        assertThat(service.score(question, value(3.14))).isEqualTo(AnswerStatus.INCORRECT);
    }

    @Test
    void numericalWithNullQuestionAnswersIsIncorrect() {
        Question question = Question.builder().questionType(QuestionType.NUMERICAL).tolerance(0.0).build();
        assertThat(service.score(question, value(3.14))).isEqualTo(AnswerStatus.INCORRECT);
    }

    private static Question numerical(String correctAnswer, Double tolerance) {
        return Question.builder()
            .questionType(QuestionType.NUMERICAL)
            .answers(new String[] { correctAnswer })
            .correctAnswers(new int[] { 0 })
            .tolerance(tolerance)
            .build();
    }

    private static QuestionAnswerRequest value(double v) {
        return new QuestionAnswerRequest(null, "numerical", null, v);
    }
}
