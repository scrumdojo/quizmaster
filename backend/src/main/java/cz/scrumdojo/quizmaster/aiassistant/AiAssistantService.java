package cz.scrumdojo.quizmaster.aiassistant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.scrumdojo.quizmaster.aiassistant.RobinChatRequest.RobinChatMessage;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
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
import java.util.Locale;
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
    private final String singleChoicePrompt;
    private final String multipleChoicePrompt;
    private final String numericalPrompt;
    private final String singleChoiceBatchPrompt;
    private final String multipleChoiceBatchPrompt;
    private final String numericalBatchPrompt;
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
        this.singleChoicePrompt = loadPrompt("prompts/single-choice.md");
        this.multipleChoicePrompt = loadPrompt("prompts/multiple-choice.md");
        this.numericalPrompt = loadPrompt("prompts/numerical.md");
        this.singleChoiceBatchPrompt = loadPrompt("prompts/single-choice-batch.md");
        this.multipleChoiceBatchPrompt = loadPrompt("prompts/multiple-choice-batch.md");
        this.numericalBatchPrompt = loadPrompt("prompts/numerical-batch.md");
        this.robinChatPrompt = loadPrompt("prompts/robin-chat.md");
    }

    private static String loadPrompt(String path) throws IOException {
        return new ClassPathResource(path).getContentAsString(StandardCharsets.UTF_8);
    }

    public QuestionResponse generateQuestion(String prompt, String questionType) {
        return generateQuestion(prompt, questionType, null);
    }

    public QuestionResponse generateQuestion(String prompt, String questionType, String workspaceGuid) {
        return generateQuestion(prompt, questionType, workspaceGuid, null);
    }

    public QuestionResponse generateQuestion(
        String prompt,
        String questionType,
        String workspaceGuid,
        Integer excludedQuestionId
    ) {
        validatePromptAndToken(prompt);
        QuestionType resolvedType = resolveType(questionType);
        List<String> allQuestionTexts = questionEmbeddingService.workspaceQuestionTexts(
            workspaceGuid,
            excludedQuestionId
        );
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings =
            questionEmbeddingService.usableWorkspaceEmbeddings(workspaceGuid, excludedQuestionId);

        AssistantResponse assistantResponse = generateCandidate(prompt, resolvedType, existingEmbeddings, null);
        validateForType(assistantResponse, resolvedType);
        DuplicateMatch duplicate = findDuplicate(assistantResponse.question(), allQuestionTexts, existingEmbeddings);
        if (duplicate == null) {
            return toDraftResponse(assistantResponse, normalizeExplanations(assistantResponse), resolvedType);
        }

        AssistantResponse retryResponse = generateCandidate(prompt, resolvedType, existingEmbeddings, duplicate);
        validateForType(retryResponse, resolvedType);
        DuplicateMatch retryDuplicate = findDuplicate(retryResponse.question(), allQuestionTexts, existingEmbeddings);
        if (retryDuplicate == null) {
            return toDraftResponse(retryResponse, normalizeExplanations(retryResponse), resolvedType);
        }

        throw duplicateGenerationFailure();
    }

    public RobinChatResponse chat(List<RobinChatMessage> messages, String workspaceGuid, Integer excludedQuestionId) {
        validateChatRequest(messages);
        List<String> allQuestionTexts = questionEmbeddingService.workspaceQuestionTexts(
            workspaceGuid,
            excludedQuestionId
        );
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings =
            questionEmbeddingService.usableWorkspaceEmbeddings(workspaceGuid, excludedQuestionId);

        AssistantBatchResponse response = generateChatCandidate(messages, existingEmbeddings, null);
        validateChatResponses(response.questions());
        DuplicateMatch duplicate = findChatDuplicate(response.questions(), allQuestionTexts, existingEmbeddings);
        if (duplicate == null) {
            return toChatResponse(response.questions());
        }

        AssistantBatchResponse retryResponse = generateChatCandidate(messages, existingEmbeddings, duplicate);
        validateChatResponses(retryResponse.questions());
        DuplicateMatch retryDuplicate = findChatDuplicate(
            retryResponse.questions(),
            allQuestionTexts,
            existingEmbeddings
        );
        if (retryDuplicate == null) {
            return toChatResponse(retryResponse.questions());
        }

        throw duplicateGenerationFailure();
    }

    public QuestionResponse[] generateQuestions(String prompt, String questionType) {
        return generateQuestions(prompt, questionType, null);
    }

    public QuestionResponse[] generateQuestions(String prompt, String questionType, String workspaceGuid) {
        validatePromptAndToken(prompt);
        QuestionType resolvedType = resolveType(questionType);
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings =
            questionEmbeddingService.usableWorkspaceEmbeddings(workspaceGuid, null);

        AssistantBatchResponse assistantResponse = generateBatchCandidate(
            prompt,
            resolvedType,
            existingEmbeddings,
            null
        );
        validateBatchResponses(assistantResponse.questions(), resolvedType);
        DuplicateMatch duplicate = findBatchDuplicate(assistantResponse.questions(), existingEmbeddings);
        if (duplicate == null) {
            return toDraftResponses(assistantResponse.questions(), resolvedType);
        }

        AssistantBatchResponse retryResponse = generateBatchCandidate(
            prompt,
            resolvedType,
            existingEmbeddings,
            duplicate
        );
        validateBatchResponses(retryResponse.questions(), resolvedType);
        DuplicateMatch retryDuplicate = findBatchDuplicate(retryResponse.questions(), existingEmbeddings);
        if (retryDuplicate == null) {
            return toDraftResponses(retryResponse.questions(), resolvedType);
        }

        throw duplicateGenerationFailure();
    }

    private void validatePromptAndToken(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question must not be empty.");
        }
        validateToken();
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

    private <T> T requestAssistant(String prompt, String systemPrompt, Class<T> responseType) {
        return requestAssistant(
            new Message[] { new Message("system", systemPrompt), new Message("user", prompt) },
            responseType
        );
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

    private AssistantResponse generateCandidate(
        String prompt,
        QuestionType resolvedType,
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings,
        DuplicateMatch retryFeedback
    ) {
        String systemPrompt =
            chooseSystemPrompt(resolvedType) + embeddingUniquenessRule(existingEmbeddings, retryFeedback);
        return requestAssistant(prompt, systemPrompt, AssistantResponse.class);
    }

    private AssistantBatchResponse generateBatchCandidate(
        String prompt,
        QuestionType resolvedType,
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings,
        DuplicateMatch retryFeedback
    ) {
        String systemPrompt =
            chooseBatchSystemPrompt(resolvedType) + embeddingUniquenessRule(existingEmbeddings, retryFeedback);
        return requestAssistant(prompt, systemPrompt, AssistantBatchResponse.class);
    }

    private AssistantBatchResponse generateChatCandidate(
        List<RobinChatMessage> messages,
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings,
        DuplicateMatch retryFeedback
    ) {
        List<Message> replay = new ArrayList<>();
        replay.add(new Message("system", robinChatPrompt + embeddingUniquenessRule(existingEmbeddings, retryFeedback)));
        for (RobinChatMessage message : messages) {
            replay.add(new Message(message.role(), transcriptContent(message)));
        }
        return requestAssistant(replay.toArray(Message[]::new), AssistantBatchResponse.class);
    }

    // Assistant turns are replayed as the canonical {questions:[...]} JSON so the model
    // always sees its prior output in schema-perfect form, whatever it originally emitted.
    private String transcriptContent(RobinChatMessage message) {
        if (message.drafts() == null) {
            return message.content() == null ? "" : message.content();
        }
        try {
            return objectMapper.writeValueAsString(new CanonicalDrafts(message.drafts()));
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid drafts in transcript.");
        }
    }

    private DuplicateMatch findDuplicate(
        String generatedQuestion,
        List<String> allQuestionTexts,
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings
    ) {
        // Exact-text check — works even when embeddings haven't been stored yet
        String normalizedGenerated = normalizeForExactMatch(generatedQuestion);
        for (String existingText : allQuestionTexts) {
            if (normalizeForExactMatch(existingText).equals(normalizedGenerated)) {
                return new DuplicateMatch(generatedQuestion, existingText, 1.0);
            }
        }

        if (existingEmbeddings.isEmpty()) {
            return null;
        }

        try {
            double[] generatedEmbedding = questionEmbeddingService.embedQuestionText(generatedQuestion);
            return highestDuplicate(generatedQuestion, generatedEmbedding, existingEmbeddings);
        } catch (RuntimeException e) {
            return null;
        }
    }

    private DuplicateMatch findChatDuplicate(
        AssistantResponse[] responses,
        List<String> allQuestionTexts,
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings
    ) {
        for (AssistantResponse response : responses) {
            String normalizedGenerated = normalizeForExactMatch(response.question());
            for (String existingText : allQuestionTexts) {
                if (normalizeForExactMatch(existingText).equals(normalizedGenerated)) {
                    return new DuplicateMatch(response.question(), existingText, 1.0);
                }
            }
        }
        return findBatchDuplicate(responses, existingEmbeddings);
    }

    private DuplicateMatch findBatchDuplicate(
        AssistantResponse[] responses,
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings
    ) {
        if (responses == null || (responses.length < 2 && existingEmbeddings.isEmpty())) {
            return null;
        }

        List<String> questions = Arrays.stream(responses).map(AssistantResponse::question).toList();

        try {
            List<double[]> generatedEmbeddings = questionEmbeddingService.embedQuestionTexts(questions);
            for (int generatedIndex = 0; generatedIndex < generatedEmbeddings.size(); generatedIndex++) {
                DuplicateMatch existingDuplicate = highestDuplicate(
                    questions.get(generatedIndex),
                    generatedEmbeddings.get(generatedIndex),
                    existingEmbeddings
                );
                if (existingDuplicate != null) {
                    return existingDuplicate;
                }

                for (int previousIndex = 0; previousIndex < generatedIndex; previousIndex++) {
                    double similarity = EmbeddingSimilarity.cosine(
                        generatedEmbeddings.get(generatedIndex),
                        generatedEmbeddings.get(previousIndex)
                    );
                    if (similarity >= similarityThreshold) {
                        return new DuplicateMatch(
                            questions.get(generatedIndex),
                            questions.get(previousIndex),
                            similarity
                        );
                    }
                }
            }
            return null;
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
        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings,
        DuplicateMatch retryFeedback
    ) {
        if (existingEmbeddings.isEmpty() && retryFeedback == null) {
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
        if (!existingEmbeddings.isEmpty()) {
            rule.append("Existing workspace questions:\n");
            appendQuestionList(
                rule,
                existingEmbeddings.stream().map(QuestionEmbeddingService.UsableQuestionEmbedding::questionText).toList()
            );
        }
        if (retryFeedback != null) {
            rule.append("\nThe previous draft was too similar to another question.\n");
            rule.append("Previous draft: ").append(retryFeedback.generatedQuestion()).append("\n");
            rule.append("Matched question: ").append(retryFeedback.matchedQuestion()).append("\n");
            rule
                .append("Similarity score: ")
                .append(String.format(Locale.ROOT, "%.4f", retryFeedback.similarity()))
                .append("\n");
            rule.append("The next draft must not preserve the same wording, answer, fact, or calculation.\n");
            rule.append(
                "Generate a clearly different question on the same broad topic while still following the answer-count request.\n"
            );
        }
        return rule.toString();
    }

    private static QuestionResponse[] toDraftResponses(AssistantResponse[] responses, QuestionType resolvedType) {
        return Arrays.stream(responses)
            .map(response -> toDraftResponse(response, normalizeExplanations(response), resolvedType))
            .toArray(QuestionResponse[]::new);
    }

    private static String normalizeForExactMatch(String text) {
        return text.trim().toLowerCase().replaceAll("[^\\p{L}\\p{N}]+", " ").replaceAll("\\s+", " ").trim();
    }

    private static ResponseStatusException duplicateGenerationFailure() {
        return new ResponseStatusException(
            HttpStatus.BAD_GATEWAY,
            "AI assistant could not generate a question that is different from existing workspace questions."
        );
    }

    private static void appendQuestionList(StringBuilder target, List<String> questions) {
        for (int i = 0; i < questions.size(); i++) {
            target.append(i + 1).append(". ").append(questions.get(i)).append("\n");
        }
    }

    private static QuestionType resolveType(String questionType) {
        if (questionType == null || questionType.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "questionType is required.");
        }
        try {
            return QuestionType.fromWire(questionType);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown questionType: " + questionType);
        }
    }

    private String chooseSystemPrompt(QuestionType resolvedType) {
        return switch (resolvedType) {
            case SINGLE -> singleChoicePrompt;
            case MULTIPLE -> multipleChoicePrompt;
            case NUMERICAL -> numericalPrompt;
        };
    }

    private String chooseBatchSystemPrompt(QuestionType resolvedType) {
        return switch (resolvedType) {
            case SINGLE -> singleChoiceBatchPrompt;
            case MULTIPLE -> multipleChoiceBatchPrompt;
            case NUMERICAL -> numericalBatchPrompt;
        };
    }

    private static void validateForType(AssistantResponse response, QuestionType resolvedType) {
        switch (resolvedType) {
            case SINGLE -> validateSingleChoiceResponse(response);
            case MULTIPLE -> validateMultipleChoiceResponse(response);
            case NUMERICAL -> validateNumericalResponse(response);
        }
    }

    static void validateBatchResponses(AssistantResponse[] responses, QuestionType resolvedType) {
        if (responses == null || responses.length < 1) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "AI assistant returned invalid batch response: need at least 1 question."
            );
        }
        for (AssistantResponse response : responses) {
            validateForType(response, resolvedType);
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

    private static RobinChatResponse toChatResponse(AssistantResponse[] responses) {
        return new RobinChatResponse(Arrays.stream(responses).map(AiAssistantService::toChatDraft).toList(), null);
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

    private static String[] normalizeExplanations(AssistantResponse response) {
        if (response.explanations() == null) {
            return new String[response.answers().length];
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

    private static QuestionResponse toDraftResponse(
        AssistantResponse assistantResponse,
        String[] explanations,
        QuestionType resolvedType
    ) {
        return QuestionResponse.draft(
            assistantResponse.question(),
            assistantResponse.answers(),
            assistantResponse.correctAnswers(),
            explanations,
            assistantResponse.questionExplanation(),
            assistantResponse.tolerance() != null ? assistantResponse.tolerance() : 0.0,
            resolvedType
        );
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
        // Chat-path fields; the legacy per-type prompts never emit them.
        @JsonProperty("questionType") String questionType,
        @JsonProperty("isEasy") Boolean isEasy,
        @JsonProperty("tags") String[] tags
    ) {
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

    private record DuplicateMatch(String generatedQuestion, String matchedQuestion, double similarity) {}
}
