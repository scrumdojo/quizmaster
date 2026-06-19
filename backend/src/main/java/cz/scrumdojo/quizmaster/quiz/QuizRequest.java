package cz.scrumdojo.quizmaster.quiz;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public record QuizRequest(
    @NotBlank String title,
    String description,
    LocalDateTime startAt,
    LocalDateTime endAt,
    int[] questionIds,
    int[] questionWeights,
    QuizMode mode,
    Difficulty difficulty,
    int passScore,
    Integer timeLimit,
    Integer randomQuestionCount
) {
    public Quiz toEntity(String workspaceGuid) {
        return Quiz.builder()
            .title(title)
            .description(description)
            .startAt(startAt)
            .endAt(endAt)
            .questionIds(questionIds)
            .questionWeights(questionWeights)
            .mode(mode != null ? mode : QuizMode.EXAM)
            .difficulty(difficulty != null ? difficulty : Difficulty.KEEP_QUESTION)
            .passScore(passScore)
            .timeLimit(timeLimit)
            .workspaceGuid(workspaceGuid)
            .randomQuestionCount(randomQuestionCount)
            .build();
    }
}
