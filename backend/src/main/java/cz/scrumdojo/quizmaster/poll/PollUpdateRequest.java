package cz.scrumdojo.quizmaster.poll;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PollUpdateRequest(@NotBlank String question, @NotNull @Size(min = 2) List<@Valid Answer> answers) {
    /**
     * An answer with an id updates the existing answer (keeping its votes);
     * an answer without an id is added as a new answer. Each answer must have
     * text, an image, or both.
     */
    public record Answer(Integer id, String text, String imageUrl) {
        @AssertTrue(message = "must have text or an image")
        public boolean isTextOrImagePresent() {
            return !isBlank(text) || !isBlank(imageUrl);
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public Poll toEntity(Integer id, String workspaceGuid) {
        List<PollAnswer> pollAnswers = answers
            .stream()
            .map(a -> new PollAnswer(a.id(), blankToEmpty(a.text()), blankToNull(a.imageUrl())))
            .toList();
        return Poll.builder().id(id).workspaceGuid(workspaceGuid).question(question).answers(pollAnswers).build();
    }

    private static String blankToNull(String value) {
        return isBlank(value) ? null : value;
    }

    private static String blankToEmpty(String value) {
        return value == null ? "" : value;
    }
}
