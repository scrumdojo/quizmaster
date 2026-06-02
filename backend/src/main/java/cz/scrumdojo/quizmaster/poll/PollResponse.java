package cz.scrumdojo.quizmaster.poll;

import java.util.Arrays;
import java.util.List;

public record PollResponse(Integer id, String question, List<String> answers) {
    public static PollResponse from(Poll poll) {
        return new PollResponse(poll.getId(), poll.getQuestion(), toAnswers(poll.getAnswers()));
    }

    private static List<String> toAnswers(String[] answers) {
        return answers == null ? List.of() : List.copyOf(Arrays.asList(answers.clone()));
    }
}
