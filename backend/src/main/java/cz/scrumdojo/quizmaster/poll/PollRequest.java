package cz.scrumdojo.quizmaster.poll;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

public record PollRequest(
    @NotBlank String question,
    @NotNull @Size(min = 2) List<String> answers,
    List<String> answerImages
) {
    @AssertTrue(message = "each answer must have text or an image")
    public boolean isEachAnswerHasTextOrImage() {
        for (int index = 0; index < answers.size(); index++) {
            String imageUrl = answerImages != null && index < answerImages.size() ? answerImages.get(index) : null;
            if (isBlank(answers.get(index)) && isBlank(imageUrl)) {
                return false;
            }
        }
        return true;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    public Poll toEntity(String workspaceGuid) {
        List<PollAnswer> pollAnswers = new ArrayList<>(answers.size());
        for (int index = 0; index < answers.size(); index++) {
            String imageUrl = answerImages != null && index < answerImages.size() ? answerImages.get(index) : null;
            pollAnswers.add(new PollAnswer(index + 1, blankToEmpty(answers.get(index)), blankToNull(imageUrl)));
        }

        return Poll.builder().workspaceGuid(workspaceGuid).question(question).answers(pollAnswers).build();
    }

    private static String blankToNull(String value) {
        return isBlank(value) ? null : value;
    }

    private static String blankToEmpty(String value) {
        return value == null ? "" : value;
    }
}
