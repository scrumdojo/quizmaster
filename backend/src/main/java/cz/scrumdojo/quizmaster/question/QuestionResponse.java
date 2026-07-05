package cz.scrumdojo.quizmaster.question;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record QuestionResponse(
    Integer id,
    String question,
    String[] answers,
    String[] explanations,
    String questionExplanation,
    int[] correctAnswers,
    String workspaceGuid,
    boolean isEasy,
    String imageUrl,
    double tolerance,
    QuestionType questionType,
    String[] tags
) {
    public QuestionResponse withWorkspaceGuid(String workspaceGuid) {
        return new QuestionResponse(
            id,
            question,
            answers,
            explanations,
            questionExplanation,
            correctAnswers,
            workspaceGuid,
            isEasy,
            imageUrl,
            tolerance,
            questionType,
            tags
        );
    }

    public static QuestionResponse from(Question q) {
        return new QuestionResponse(
            q.getId(),
            q.getQuestion(),
            q.getAnswers(),
            q.getExplanations(),
            q.getQuestionExplanation(),
            q.getCorrectAnswers(),
            q.getWorkspaceGuid(),
            q.isEasy(),
            q.getImageUrl(),
            q.getTolerance(),
            q.getQuestionType(),
            q.getTags()
        );
    }

    public static QuestionResponse feedbackFrom(Question q) {
        return from(q).withWorkspaceGuid(null);
    }
}
