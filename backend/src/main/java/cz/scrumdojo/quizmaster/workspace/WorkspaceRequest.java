package cz.scrumdojo.quizmaster.workspace;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public record WorkspaceRequest(@NotBlank String title) {
    public Workspace toEntity(LocalDateTime createdAt) {
        return Workspace.builder().title(title).createdAt(createdAt).build();
    }
}
