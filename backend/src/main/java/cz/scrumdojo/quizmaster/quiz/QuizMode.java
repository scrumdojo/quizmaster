package cz.scrumdojo.quizmaster.quiz;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum QuizMode {
    @JsonProperty("learn")
    LEARN,
    @JsonProperty("exam")
    EXAM,
    @JsonProperty("buzzer")
    BUZZER,
}
