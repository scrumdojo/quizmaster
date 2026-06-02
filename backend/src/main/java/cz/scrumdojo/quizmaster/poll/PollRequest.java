package cz.scrumdojo.quizmaster.poll;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PollRequest(@NotBlank String question, @NotNull @Size(min = 2) List<@NotBlank String> answers) {
    public Poll toEntity(String workspaceGuid) {
        return Poll.builder()
            .workspaceGuid(workspaceGuid)
            .question(question)
            .answers(answers.toArray(String[]::new))
            .build();
    }
}
