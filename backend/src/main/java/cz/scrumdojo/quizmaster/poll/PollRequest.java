package cz.scrumdojo.quizmaster.poll;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

public record PollRequest(@NotBlank String question, @NotNull @Size(min = 2) List<@NotBlank String> answers) {
    public Poll toEntity(String workspaceGuid) {
        List<PollAnswer> pollAnswers = new ArrayList<>(answers.size());
        for (int index = 0; index < answers.size(); index++) {
            pollAnswers.add(new PollAnswer(index + 1, answers.get(index)));
        }

        return Poll.builder().workspaceGuid(workspaceGuid).question(question).answers(pollAnswers).build();
    }
}
