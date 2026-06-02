package cz.scrumdojo.quizmaster.poll;

import jakarta.validation.constraints.NotNull;

public record PollVoteRequest(@NotNull Integer selectedAnswerId) {}
