package cz.scrumdojo.quizmaster.poll;

import java.util.List;

public record PollResponse(Integer id, String question, List<PollAnswer> answers) {
    public static PollResponse from(Poll poll) {
        return new PollResponse(poll.getId(), poll.getQuestion(), List.copyOf(poll.getAnswers()));
    }
}
