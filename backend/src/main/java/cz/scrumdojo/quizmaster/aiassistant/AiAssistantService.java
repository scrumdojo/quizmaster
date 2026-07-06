package cz.scrumdojo.quizmaster.aiassistant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.scrumdojo.quizmaster.aiassistant.RobinChatRequest.RobinChatMessage;
import cz.scrumdojo.quizmaster.question.QuestionType;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
public class AiAssistantService {

    private static final String OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final Duration TIMEOUT = Duration.ofSeconds(60);

    private final ObjectMapper objectMapper;
    private final QuestionEmbeddingService questionEmbeddingService;
    private final HttpClient httpClient;
    private final String apiToken;
    private final String model;
    private final int maxTokens;
    private final double similarityThreshold;
    private final String robinChatPrompt;

    public AiAssistantService(
        ObjectMapper objectMapper,
        QuestionEmbeddingService questionEmbeddingService,
        @Value("${ai.token:}") String apiToken,
        @Value("${ai.model}") String model,
        @Value("${ai.max-tokens}") int maxTokens,
        @Value("${ai.embedding.similarity-threshold}") double similarityThreshold
    ) throws IOException {
        this.objectMapper = objectMapper;
        this.questionEmbeddingService = questionEmbeddingService;
        this.apiToken = apiToken.strip();
        this.model = model;
        this.maxTokens = maxTokens;
        this.similarityThreshold = similarityThreshold;
        this.httpClient = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();
        this.robinChatPrompt = loadPrompt("prompts/robin-chat.md");
    }

    private static String loadPrompt(String path) throws IOException {
        return new ClassPathResource(path).getContentAsString(StandardCharsets.UTF_8);
    }

    // A duplicate is not an error in a conversation: the duplicate drafts are filtered
    // out and reported back as a notice, and the maker's next message is the retry.
    public RobinChatResponse chat(List<RobinChatMessage> messages, String workspaceGuid, Integer excludedQuestionId) {
        validateChatRequest(messages);
        List<String> allQuestionTexts = questionEmbeddingService.workspaceQuestionTexts(
            workspaceGuid,
            excludedQuestionId
        );
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings =
            questionEmbeddingService.usableWorkspaceEmbeddings(workspaceGuid, excludedQuestionId);

        AssistantBatchResponse response = generateChatCandidate(messages, existingEmbeddings);
        validateChatResponses(response.questions());

        List<QuestionDraft> drafts = new ArrayList<>();
        List<String> duplicatedQuestions = new ArrayList<>();
        for (AssistantResponse question : response.questions()) {
            DuplicateMatch duplicate = findChatDuplicate(question, allQuestionTexts, existingEmbeddings);
            if (duplicate == null) {
                drafts.add(toChatDraft(question));
            } else {
                duplicatedQuestions.add(duplicate.matchedQuestion());
            }
        }

        return new RobinChatResponse(drafts, duplicateNotice(duplicatedQuestions));
    }

    static String duplicateNotice(List<String> duplicatedQuestions) {
        if (duplicatedQuestions.isEmpty()) {
            return null;
        }
        return (
            "I did not draft " +
            (duplicatedQuestions.size() == 1 ? "one question" : duplicatedQuestions.size() + " questions") +
            " because the workspace already covers: " +
            String.join("; ", duplicatedQuestions) +
            " — ask me for a different angle on the topic."
        );
    }

    private void validateToken() {
        if (apiToken == null || apiToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI token is not configured.");
        }
    }

    private void validateChatRequest(List<RobinChatMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Messages must not be empty.");
        }
        RobinChatMessage last = messages.get(messages.size() - 1);
        if (!"user".equals(last.role()) || last.content() == null || last.content().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Last message must be a user message with non-empty content."
            );
        }
        validateToken();
    }

    private <T> T requestAssistant(Message[] messages, Class<T> responseType) {
        try {
            String body = objectMapper.writeValueAsString(
                new ChatRequest(model, messages, new ResponseFormat("json_object"), maxTokens)
            );

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
            return objectMapper.readValue(content, responseType);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("OpenRouter request failed", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI assistant request failed.");
        }
    }

    private AssistantBatchResponse generateChatCandidate(
        List<RobinChatMessage> messages,
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings
    ) {
        List<Message> replay = new ArrayList<>();
        replay.add(new Message("system", robinChatPrompt + embeddingUniquenessRule(existingEmbeddings)));
        for (RobinChatMessage message : messages) {
            replay.add(new Message(message.role(), transcriptContent(message)));
        }
        return requestAssistant(replay.toArray(Message[]::new), AssistantBatchResponse.class);
    }

    // Assistant turns are replayed as the canonical {questions:[...]} JSON so the model
    // always sees its prior output in schema-perfect form, whatever it originally emitted.
    String transcriptContent(RobinChatMessage message) {
        if (message.drafts() == null) {
            return message.content() == null ? "" : message.content();
        }
        try {
            return objectMapper.writeValueAsString(new CanonicalDrafts(message.drafts()));
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid drafts in transcript.");
        }
    }

    DuplicateMatch findChatDuplicate(
        AssistantResponse response,
        List<String> allQuestionTexts,
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings
    ) {
        // Exact-text check — works even when embeddings haven't been stored yet
        String normalizedGenerated = normalizeForExactMatch(response.question());
        for (String existingText : allQuestionTexts) {
            if (normalizeForExactMatch(existingText).equals(normalizedGenerated)) {
                return new DuplicateMatch(response.question(), existingText, 1.0);
            }
        }

        if (existingEmbeddings.isEmpty()) {
            return null;
        }

        try {
            double[] generatedEmbedding = questionEmbeddingService.embedQuestionText(response.question());
            return highestDuplicate(response.question(), generatedEmbedding, existingEmbeddings);
        } catch (RuntimeException e) {
            return null;
        }
    }

    private DuplicateMatch highestDuplicate(
        String generatedQuestion,
        double[] generatedEmbedding,
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings
    ) {
        DuplicateMatch bestMatch = null;
        for (QuestionEmbeddingService.UsableQuestionEmbedding existing : existingEmbeddings) {
            double similarity = EmbeddingSimilarity.cosine(generatedEmbedding, existing.embedding());
            if (similarity >= similarityThreshold && (bestMatch == null || similarity > bestMatch.similarity())) {
                bestMatch = new DuplicateMatch(generatedQuestion, existing.questionText(), similarity);
            }
        }
        return bestMatch;
    }

    private static String embeddingUniquenessRule(
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings
    ) {
        if (existingEmbeddings.isEmpty()) {
            return "";
        }

        StringBuilder rule = new StringBuilder();
        rule.append(
            """

            Workspace uniqueness rule:
            This rule overrides any user request for an exact duplicate.
            Do not create a question that is similar to existing workspace questions.
            Similar means the generated question tests the same knowledge, fact, or calculation as an existing question.
            The same broad topic is allowed when the concrete question is different.
            If the user asks for an exact duplicate, keep only the broad topic and create a question about a different fact, concept, or calculation.
            """
        );
        rule.append("Existing workspace questions:\n");
        appendQuestionList(
            rule,
            existingEmbeddings.stream().map(QuestionEmbeddingService.UsableQuestionEmbedding::questionText).toList()
        );
        return rule.toString();
    }

    private static String normalizeForExactMatch(String text) {
        return text.trim().toLowerCase().replaceAll("[^\\p{L}\\p{N}]+", " ").replaceAll("\\s+", " ").trim();
    }

    private static void appendQuestionList(StringBuilder target, List<String> questions) {
        for (int i = 0; i < questions.size(); i++) {
            target.append(i + 1).append(". ").append(questions.get(i)).append("\n");
        }
    }

    private static void validateForType(AssistantResponse response, QuestionType resolvedType) {
        switch (resolvedType) {
            case SINGLE -> validateSingleChoiceResponse(response);
            case MULTIPLE -> validateMultipleChoiceResponse(response);
            case NUMERICAL -> validateNumericalResponse(response);
        }
    }

    static void validateChatResponses(AssistantResponse[] responses) {
        if (responses == null || responses.length < 1) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid chat response: need at least 1 question."
            );
        }
        for (AssistantResponse response : responses) {
            validateForType(response, resolveChatType(response.questionType()));
        }
    }

    private static QuestionType resolveChatType(String questionType) {
        if (questionType == null || questionType.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid chat response: missing questionType."
            );
        }
        try {
            return QuestionType.fromWire(questionType);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid chat response: unknown questionType " + questionType + "."
            );
        }
    }

    private static QuestionDraft toChatDraft(AssistantResponse response) {
        QuestionType type = resolveChatType(response.questionType());
        Double tolerance = response.tolerance();
        if (tolerance == null && type == QuestionType.NUMERICAL) {
            tolerance = 0.0;
        }
        return new QuestionDraft(
            response.question(),
            type,
            response.answers(),
            response.correctAnswers(),
            normalizeExplanations(response),
            response.questionExplanation() == null ? "" : response.questionExplanation(),
            tolerance,
            response.isEasy(),
            response.tags()
        );
    }

    static void validateResponse(AssistantResponse response) {
        if (response.question() == null || response.question().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: missing question."
            );
        }
        if (response.answers() == null || response.answers().length < 2) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: need at least 2 answers."
            );
        }
        if (response.correctAnswers() == null || response.correctAnswers().length < 1) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: need at least 1 correct answer."
            );
        }
        if (response.explanations() != null && response.explanations().length != response.answers().length) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: explanations length mismatch."
            );
        }
        boolean allInBounds = Arrays.stream(response.correctAnswers()).allMatch(
            i -> i >= 0 && i < response.answers().length
        );
        if (!allInBounds) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: correctAnswers index out of bounds."
            );
        }
    }

    static void validateSingleChoiceResponse(AssistantResponse response) {
        validateResponse(response);
        if (response.correctAnswers().length != 1) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: single-choice must have exactly 1 correct answer."
            );
        }
    }

    static void validateMultipleChoiceResponse(AssistantResponse response) {
        validateResponse(response);
        if (response.correctAnswers().length < 2) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: multiple-choice must have at least 2 correct answers."
            );
        }
    }

    static void validateNumericalResponse(AssistantResponse response) {
        if (response.question() == null || response.question().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: missing question."
            );
        }
        if (response.answers() == null || response.answers().length != 1) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: numerical must have exactly 1 answer."
            );
        }
        if (response.answers()[0] == null || response.answers()[0].isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: numerical answer must not be empty."
            );
        }
        try {
            Double.parseDouble(response.answers()[0].trim());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: numerical answer must parse as a number."
            );
        }
        if (
            response.correctAnswers() == null ||
            response.correctAnswers().length != 1 ||
            response.correctAnswers()[0] != 0
        ) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: numerical correctAnswers must be [0]."
            );
        }
        if (response.explanations() != null && response.explanations().length != 1) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: numerical explanations length must be 1."
            );
        }
        if (response.tolerance() != null && response.tolerance() < 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: tolerance must be non-negative."
            );
        }
    }

    static String[] normalizeExplanations(AssistantResponse response) {
        if (response.explanations() == null) {
            String[] empty = new String[response.answers().length];
            Arrays.fill(empty, "");
            return empty;
        }
        if (response.explanations().length != response.answers().length) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid response: explanations length mismatch."
            );
        }
        return Arrays.stream(response.explanations())
            .map(e -> e == null ? "" : e)
            .toArray(String[]::new);
    }

    private record ChatRequest(
        String model,
        Message[] messages,
        @JsonProperty("response_format") ResponseFormat responseFormat,
        @JsonProperty("max_tokens") int maxTokens
    ) {}

    private record ResponseFormat(String type) {}

    private record Message(String role, String content) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record AssistantResponse(
        String question,
        String[] answers,
        int[] correctAnswers,
        String[] explanations,
        @JsonProperty("tolerance") Double tolerance,
        @JsonProperty("questionExplanation") String questionExplanation,
        // Fields the unified chat prompt emits on every question.
        @JsonProperty("questionType") String questionType,
        @JsonProperty("isEasy") Boolean isEasy,
        @JsonProperty("tags") String[] tags
    ) {
        // Test-only convenience: omits the chat fields (questionType/isEasy/tags)
        // so the shared per-field validators can be exercised in isolation.
        AssistantResponse(
            String question,
            String[] answers,
            int[] correctAnswers,
            String[] explanations,
            Double tolerance,
            String questionExplanation
        ) {
            this(question, answers, correctAnswers, explanations, tolerance, questionExplanation, null, null, null);
        }
    }

    record AssistantBatchResponse(AssistantResponse[] questions) {}

    private record CanonicalDrafts(List<QuestionDraft> questions) {}

    record DuplicateMatch(String generatedQuestion, String matchedQuestion, double similarity) {}
}
