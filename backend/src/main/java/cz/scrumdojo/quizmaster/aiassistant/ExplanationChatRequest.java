package cz.scrumdojo.quizmaster.aiassistant;

import cz.scrumdojo.quizmaster.question.QuestionAnswerRequest;
import java.util.List;

public record ExplanationChatRequest(QuestionAnswerRequest givenAnswer, List<ExplanationChatMessage> messages) {
    public record ExplanationChatMessage(String role, String content) {}
}
