package cz.scrumdojo.quizmaster.poll;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PollUpdateRequest(@NotBlank String question, @NotNull @Size(min = 2) List<@Valid Answer> answers) {
    /**
     * An answer with an id updates the existing answer (keeping its votes);
     * an answer without an id is added as a new answer.
     */
    public record Answer(Integer id, @NotBlank String text) {}

    public Poll toEntity(Integer id, String workspaceGuid) {
        List<PollAnswer> pollAnswers = answers
            .stream()
            .map(a -> new PollAnswer(a.id(), a.text()))
            .toList();
        return Poll.builder().id(id).workspaceGuid(workspaceGuid).question(question).answers(pollAnswers).build();
    }
}
