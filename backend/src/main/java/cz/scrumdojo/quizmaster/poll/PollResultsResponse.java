package cz.scrumdojo.quizmaster.poll;

import java.util.List;

public record PollResultsResponse(Integer pollId, List<PollResultItem> answers) {
    public record PollResultItem(Integer answerId, String text, Integer voteCount) {}
}
