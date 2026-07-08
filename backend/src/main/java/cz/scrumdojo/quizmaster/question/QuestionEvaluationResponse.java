package cz.scrumdojo.quizmaster.question;

import com.fasterxml.jackson.annotation.JsonInclude;
import cz.scrumdojo.quizmaster.attempt.AnswerStatus;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record QuestionEvaluationResponse(
    AnswerStatus status,
    double score,
    QuestionResponse question,
    boolean missedBefore
) {
    public static QuestionEvaluationResponse from(AnswerStatus status, QuestionResponse feedback) {
        return from(status, feedback, false);
    }

    public static QuestionEvaluationResponse from(
        AnswerStatus status,
        QuestionResponse feedback,
        boolean missedBefore
    ) {
        return new QuestionEvaluationResponse(status, status.points(), feedback, missedBefore);
    }
}
