package cz.scrumdojo.quizmaster.aiassistant;

import java.util.List;

public record RobinChatRequest(List<RobinChatMessage> messages, Integer excludedQuestionId) {
    public record RobinChatMessage(String role, String content, List<QuestionDraft> drafts) {}
}
