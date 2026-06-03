package cz.scrumdojo.quizmaster.question;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum QuestionType {
    SINGLE("single"),
    MULTIPLE("multiple"),
    NUMERICAL("numerical");

    private final String wire;

    QuestionType(String wire) {
        this.wire = wire;
    }

    @JsonValue
    public String wire() {
        return wire;
    }

    @JsonCreator
    public static QuestionType fromWire(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        for (QuestionType type : values()) {
            if (type.wire.equalsIgnoreCase(trimmed)) return type;
        }
        throw new IllegalArgumentException("Unknown questionType: " + value);
    }
}
