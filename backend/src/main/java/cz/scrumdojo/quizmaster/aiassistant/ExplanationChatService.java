package cz.scrumdojo.quizmaster.aiassistant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.scrumdojo.quizmaster.aiassistant.ExplanationChatRequest.ExplanationChatMessage;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

// Slice 1a: proves the OpenRouter round trip with a generic placeholder prompt.
// The question, given answer, and explanation are not part of the conversation yet.
@Slf4j
@Service
public class ExplanationChatService {

    private static final String OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final Duration TIMEOUT = Duration.ofSeconds(60);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiToken;
    private final String model;
    private final int maxTokens;
    private final String explanationChatPrompt;

    public ExplanationChatService(
        ObjectMapper objectMapper,
        @Value("${ai.token:}") String apiToken,
        @Value("${ai.model}") String model,
        @Value("${ai.max-tokens}") int maxTokens
    ) throws IOException {
        this.objectMapper = objectMapper;
        this.apiToken = apiToken.strip();
        this.model = model;
        this.maxTokens = maxTokens;
        this.httpClient = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();
        this.explanationChatPrompt = new ClassPathResource("prompts/explanation-chat.md").getContentAsString(
            StandardCharsets.UTF_8
        );
    }

    public ExplanationChatResponse chat(List<ExplanationChatMessage> messages) {
        validateChatRequest(messages);

        List<Message> replay = new ArrayList<>();
        replay.add(new Message("system", explanationChatPrompt));
        for (ExplanationChatMessage message : messages) {
            replay.add(new Message(message.role(), message.content()));
        }

        return new ExplanationChatResponse(requestAssistant(replay.toArray(Message[]::new)));
    }

    private void validateChatRequest(List<ExplanationChatMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Messages must not be empty.");
        }
        ExplanationChatMessage last = messages.get(messages.size() - 1);
        if (!"user".equals(last.role()) || last.content() == null || last.content().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Last message must be a user message with non-empty content."
            );
        }
        if (apiToken == null || apiToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI token is not configured.");
        }
    }

    private String requestAssistant(Message[] messages) {
        try {
            String body = objectMapper.writeValueAsString(new ChatRequest(model, messages, maxTokens));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OPENROUTER_URL))
                .timeout(TIMEOUT)
                .header("Authorization", "Bearer " + apiToken)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("OpenRouter request failed: status={}", response.statusCode());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant request failed.");
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("choices").path(0).path("message").path("content").asText("").trim();
            if (content.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant returned an empty reply.");
            }
            return content;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("OpenRouter request failed", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant request failed.");
        }
    }

    private record ChatRequest(String model, Message[] messages, @JsonProperty("max_tokens") int maxTokens) {}

    private record Message(String role, String content) {}
}
