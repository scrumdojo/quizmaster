package cz.scrumdojo.quizmaster.poll;

public record PollListResponse(Integer id, String question) {
    public static PollListResponse from(Poll poll) {
        return new PollListResponse(poll.getId(), poll.getQuestion());
    }
}
