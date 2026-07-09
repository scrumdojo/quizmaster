package cz.scrumdojo.quizmaster.aiassistant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import cz.scrumdojo.quizmaster.aiassistant.ExplanationChatRequest.ExplanationChatMessage;
import cz.scrumdojo.quizmaster.common.CodedResponseStatusException;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class ExplanationChatServiceTest {

    @Autowired
    private ExplanationChatService explanationChatService;

    @Value("${ai.token:}")
    private String apiToken;

    @Test
    void chatFailsOnEmptyMessages() {
        CodedResponseStatusException exception = assertThrows(CodedResponseStatusException.class, () ->
            explanationChatService.chat(null, null, List.of())
        );
        assertEquals("empty-chat-messages", exception.getCode());
    }

    @Test
    void chatFailsWhenLastMessageIsNotFromUser() {
        CodedResponseStatusException exception = assertThrows(CodedResponseStatusException.class, () ->
            explanationChatService.chat(null, null, List.of(new ExplanationChatMessage("assistant", "Hi there.")))
        );
        assertEquals("invalid-last-message", exception.getCode());
    }

    @Test
    void chatFailsWhenLastUserMessageIsBlank() {
        CodedResponseStatusException exception = assertThrows(CodedResponseStatusException.class, () ->
            explanationChatService.chat(null, null, List.of(new ExplanationChatMessage("user", "   ")))
        );
        assertEquals("invalid-last-message", exception.getCode());
    }

    @Test
    void chatFailsWhenAiTokenIsNotConfigured() {
        assumeTrue(apiToken.isBlank(), "ai.token is configured; token-not-configured case cannot occur");

        CodedResponseStatusException exception = assertThrows(CodedResponseStatusException.class, () ->
            explanationChatService.chat(null, null, List.of(new ExplanationChatMessage("user", "Explain this?")))
        );
        assertEquals("ai-token-not-configured", exception.getCode());
    }
}
