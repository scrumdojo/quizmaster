package cz.scrumdojo.quizmaster.aiassistant;

import java.util.List;

public record ExplanationChatRequest(List<ExplanationChatMessage> messages) {
    public record ExplanationChatMessage(String role, String content) {}
}
