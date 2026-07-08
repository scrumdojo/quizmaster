package cz.scrumdojo.quizmaster.attempt;

import com.fasterxml.jackson.annotation.JsonProperty;

public record BuzzerStatus(Lobby status, Integer secondsRemaining) {
    public enum Lobby {
        @JsonProperty("waiting")
        WAITING,
        @JsonProperty("countdown")
        COUNTDOWN,
        @JsonProperty("started")
        STARTED,
    }

    public static BuzzerStatus waiting() {
        return new BuzzerStatus(Lobby.WAITING, null);
    }

    public static BuzzerStatus countdown(int secondsRemaining) {
        return new BuzzerStatus(Lobby.COUNTDOWN, secondsRemaining);
    }

    public static BuzzerStatus started() {
        return new BuzzerStatus(Lobby.STARTED, null);
    }
}
