package cz.scrumdojo.quizmaster.question;

import jakarta.validation.constraints.NotBlank;

public record QuestionRequest(
    @NotBlank String question,
    String[] answers,
    int[] correctAnswers,
    String[] explanations,
    String questionExplanation,
    boolean isEasy,
    String imageUrl,
    QuestionType questionType,
    Double tolerance,
    String[] tags
) {
    public Question toEntity(String workspaceGuid) {
        return Question.builder()
            .question(question)
            .answers(answers)
            .correctAnswers(correctAnswers)
            .explanations(explanations)
            .questionExplanation(questionExplanation)
            .isEasy(isEasy)
            .workspaceGuid(workspaceGuid)
            .imageUrl(imageUrl)
            .tolerance(tolerance)
            .questionType(resolveQuestionType())
            .tags(tags != null ? tags : new String[0])
            .build();
    }

    private QuestionType resolveQuestionType() {
        if (questionType != null) return questionType;
        if (correctAnswers != null && correctAnswers.length >= 2) return QuestionType.MULTIPLE;
        if (
            answers != null && answers.length == 1 && correctAnswers != null && correctAnswers.length == 1
        ) return QuestionType.NUMERICAL;
        return QuestionType.SINGLE;
    }
}
