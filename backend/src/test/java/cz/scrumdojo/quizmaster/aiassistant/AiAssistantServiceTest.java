package cz.scrumdojo.quizmaster.aiassistant;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionType;
import cz.scrumdojo.quizmaster.workspace.Workspace;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
public class AiAssistantServiceTest {

    @Autowired
    private AiAssistantService aiAssistantService;

    @Autowired
    private QuestionEmbeddingService questionEmbeddingService;

    @Autowired
    private TestFixtures fixtures;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${ai.token:}")
    private String apiToken;

    @Value("${ai.embedding.model}")
    private String embeddingModel;

    @Test
    void chatFailsOnEmptyMessages() {
        assertThrows(ResponseStatusException.class, () -> aiAssistantService.chat(List.of(), null, null));
    }

    @Test
    void chatFailsWhenLastTurnIsNotAUserMessage() {
        assertThrows(ResponseStatusException.class, () ->
            aiAssistantService.chat(
                List.of(new RobinChatRequest.RobinChatMessage("assistant", null, List.of())),
                null,
                null
            )
        );
        assertThrows(ResponseStatusException.class, () ->
            aiAssistantService.chat(List.of(new RobinChatRequest.RobinChatMessage("user", "   ", null)), null, null)
        );
    }

    @Test
    void usableWorkspaceEmbeddingsCanExcludeQuestionBeingEdited() {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question editedQuestion = fixtures.save(
            withUsableEmbedding(
                fixtures.questionIn(workspace).question("What is 2 + 2?").build(),
                new double[] { 1.0, 0.0 }
            )
        );
        fixtures.save(
            withUsableEmbedding(
                fixtures.questionIn(workspace).question("What is 3 + 3?").build(),
                new double[] { 0.0, 1.0 }
            )
        );

        List<QuestionEmbeddingService.UsableQuestionEmbedding> existingEmbeddings =
            questionEmbeddingService.usableWorkspaceEmbeddings(workspace.getGuid(), editedQuestion.getId());

        assertEquals(
            List.of("What is 3 + 3?"),
            existingEmbeddings.stream().map(QuestionEmbeddingService.UsableQuestionEmbedding::questionText).toList()
        );
    }

    @Tag("ai")
    @Test
    void chatInfersSingleChoiceFromNaturalLanguage() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var draft = singleChatDraft("Ask one question about capital cities with 1 correct and 2 incorrect answers");

        assertGeneralChoiceDraft(draft);
        assertEquals(1, draft.correctAnswers().length);
        assertEquals(QuestionType.SINGLE, draft.questionType());
    }

    @Tag("ai")
    @Test
    void chatInfersMultipleChoiceFromNaturalLanguage() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var draft = singleChatDraft(
            "Ask one question about European capitals with 2 correct answers and 2 incorrect answers"
        );

        assertGeneralChoiceDraft(draft);
        assertTrue(draft.correctAnswers().length >= 2, "Expected at least 2 correct answers");
        assertEquals(QuestionType.MULTIPLE, draft.questionType());
    }

    @Tag("ai")
    @Test
    void chatInfersNumericalFromNaturalLanguage() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var draft = singleChatDraft("Ask one numerical question about basic arithmetic");

        assertNotNull(draft.question());
        assertFalse(draft.question().isBlank());
        assertEquals(1, draft.answers().length, "Numerical must have exactly 1 answer");
        assertDoesNotThrow(() -> Double.parseDouble(draft.answers()[0].trim()));
        assertArrayEquals(new int[] { 0 }, draft.correctAnswers());
        assertEquals(QuestionType.NUMERICAL, draft.questionType());
    }

    @Tag("ai")
    @Test
    void chatHonorsExactAnswerCounts() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var draft = singleChatDraft(
            "Ask one question on exoplanets with exactly 2 correct answers and exactly 2 incorrect answers."
        );

        assertFalse(draft.question().isBlank());
        assertEquals(4, draft.answers().length, "Expected exactly 4 answers");
        assertEquals(2, draft.correctAnswers().length, "Expected exactly 2 correct answers");
    }

    @Tag("ai")
    @Test
    void chatRefinesItsPriorDraftFromTheTranscript() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var firstTurn = singleChatDraft(
            "Ask one single-choice question about European capitals with exactly 3 answers."
        );

        RobinChatResponse refined = aiAssistantService.chat(
            List.of(
                new RobinChatRequest.RobinChatMessage(
                    "user",
                    "Ask one single-choice question about European capitals with exactly 3 answers.",
                    null
                ),
                new RobinChatRequest.RobinChatMessage("assistant", null, List.of(firstTurn)),
                new RobinChatRequest.RobinChatMessage("user", "Add one more incorrect answer to the question.", null)
            ),
            null,
            null
        );

        assertEquals(1, refined.drafts().size());
        QuestionDraft refinedDraft = refined.drafts().get(0);
        assertEquals(firstTurn.answers().length + 1, refinedDraft.answers().length, "Expected one added answer");
        assertEquals(1, refinedDraft.correctAnswers().length, "Expected the single correct answer preserved");
    }

    private QuestionDraft singleChatDraft(String prompt) {
        RobinChatResponse response = aiAssistantService.chat(
            List.of(new RobinChatRequest.RobinChatMessage("user", prompt, null)),
            null,
            null
        );
        assertEquals(1, response.drafts().size(), "Expected exactly 1 draft");
        return response.drafts().get(0);
    }

    @Test
    void validateResponse_valid() {
        assertDoesNotThrow(() ->
            AiAssistantService.validateResponse(
                new AiAssistantService.AssistantResponse(
                    "What is 2+2?",
                    new String[] { "4", "5" },
                    new int[] { 0 },
                    new String[] { "", "" },
                    null,
                    null
                )
            )
        );
    }

    @Test
    void validateResponse_emptyQuestion() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateResponse(
                new AiAssistantService.AssistantResponse(
                    "",
                    new String[] { "4", "5" },
                    new int[] { 0 },
                    new String[] { "", "" },
                    null,
                    null
                )
            )
        );
    }

    @Test
    void validateResponse_nullQuestion() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateResponse(
                new AiAssistantService.AssistantResponse(
                    null,
                    new String[] { "4", "5" },
                    new int[] { 0 },
                    new String[] { "", "" },
                    null,
                    null
                )
            )
        );
    }

    @Test
    void validateResponse_tooFewAnswers() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateResponse(
                new AiAssistantService.AssistantResponse(
                    "Question?",
                    new String[] { "only one" },
                    new int[] { 0 },
                    new String[] { "" },
                    null,
                    null
                )
            )
        );
    }

    @Test
    void validateResponse_noCorrectAnswers() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateResponse(
                new AiAssistantService.AssistantResponse(
                    "Question?",
                    new String[] { "a", "b" },
                    new int[] {},
                    new String[] { "", "" },
                    null,
                    null
                )
            )
        );
    }

    @Test
    void validateResponse_indexOutOfBounds() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateResponse(
                new AiAssistantService.AssistantResponse(
                    "Question?",
                    new String[] { "a", "b" },
                    new int[] { 5 },
                    new String[] { "", "" },
                    null,
                    null
                )
            )
        );
    }

    @Test
    void validateResponse_negativeIndex() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateResponse(
                new AiAssistantService.AssistantResponse(
                    "Question?",
                    new String[] { "a", "b" },
                    new int[] { -1 },
                    new String[] { "", "" },
                    null,
                    null
                )
            )
        );
    }

    @Test
    void normalizeExplanationsFillsEmptyStringsWhenAbsent() {
        String[] result = AiAssistantService.normalizeExplanations(
            new AiAssistantService.AssistantResponse("Q?", new String[] { "a", "b" }, new int[] { 0 }, null, null, null)
        );
        assertArrayEquals(new String[] { "", "" }, result);
    }

    @Test
    void normalizeExplanationsMapsNullElementsToEmptyStrings() {
        String[] result = AiAssistantService.normalizeExplanations(
            new AiAssistantService.AssistantResponse(
                "Q?",
                new String[] { "a", "b" },
                new int[] { 0 },
                new String[] { "because", null },
                null,
                null
            )
        );
        assertArrayEquals(new String[] { "because", "" }, result);
    }

    @Test
    void validateNumericalResponse_valid() {
        assertDoesNotThrow(() ->
            AiAssistantService.validateNumericalResponse(
                new AiAssistantService.AssistantResponse(
                    "What is pi to two decimals?",
                    new String[] { "3.14" },
                    new int[] { 0 },
                    new String[] { "" },
                    0.01,
                    null
                )
            )
        );
    }

    @Test
    void validateNumericalResponse_missingQuestion() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateNumericalResponse(
                new AiAssistantService.AssistantResponse("", new String[] { "3.14" }, new int[] { 0 }, null, null, null)
            )
        );
    }

    @Test
    void validateNumericalResponse_wrongAnswersLength() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateNumericalResponse(
                new AiAssistantService.AssistantResponse(
                    "Question?",
                    new String[] { "3.14", "extra" },
                    new int[] { 0 },
                    null,
                    null,
                    null
                )
            )
        );
    }

    @Test
    void validateNumericalResponse_nonNumericAnswer() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateNumericalResponse(
                new AiAssistantService.AssistantResponse(
                    "Question?",
                    new String[] { "not-a-number" },
                    new int[] { 0 },
                    null,
                    null,
                    null
                )
            )
        );
    }

    @Test
    void validateNumericalResponse_wrongCorrectAnswers() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateNumericalResponse(
                new AiAssistantService.AssistantResponse(
                    "Question?",
                    new String[] { "3.14" },
                    new int[] { 1 },
                    null,
                    null,
                    null
                )
            )
        );
    }

    @Test
    void validateNumericalResponse_negativeTolerance() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateNumericalResponse(
                new AiAssistantService.AssistantResponse(
                    "Question?",
                    new String[] { "3.14" },
                    new int[] { 0 },
                    null,
                    -0.01,
                    null
                )
            )
        );
    }

    @Test
    void validateNumericalResponse_wrongExplanationsLength() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateNumericalResponse(
                new AiAssistantService.AssistantResponse(
                    "Question?",
                    new String[] { "3.14" },
                    new int[] { 0 },
                    new String[] { "one", "extra" },
                    null,
                    null
                )
            )
        );
    }

    @Test
    void validateChatResponses_acceptsMixedDeclaredTypes() {
        assertDoesNotThrow(() ->
            AiAssistantService.validateChatResponses(
                new AiAssistantService.AssistantResponse[] {
                    chatResponse("Single?", new String[] { "a", "b" }, new int[] { 0 }, "single"),
                    chatResponse("Multiple?", new String[] { "a", "b", "c" }, new int[] { 0, 1 }, "multiple"),
                    chatResponse("What is 5 / 2?", new String[] { "2.5" }, new int[] { 0 }, "numerical"),
                }
            )
        );
    }

    @Test
    void validateChatResponses_rejectsMissingQuestionType() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateChatResponses(
                new AiAssistantService.AssistantResponse[] {
                    chatResponse("Single?", new String[] { "a", "b" }, new int[] { 0 }, null),
                }
            )
        );
    }

    @Test
    void validateChatResponses_rejectsUnknownQuestionType() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateChatResponses(
                new AiAssistantService.AssistantResponse[] {
                    chatResponse("Single?", new String[] { "a", "b" }, new int[] { 0 }, "essay"),
                }
            )
        );
    }

    @Test
    void validateChatResponses_rejectsTypeMismatch() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateChatResponses(
                new AiAssistantService.AssistantResponse[] {
                    // Declared multiple but carries only one correct answer.
                    chatResponse("Multiple?", new String[] { "a", "b", "c" }, new int[] { 0 }, "multiple"),
                }
            )
        );
    }

    @Test
    void validateChatResponses_requiresAtLeastOneQuestion() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateChatResponses(new AiAssistantService.AssistantResponse[] {})
        );
    }

    @Test
    void transcriptContentSerializesDraftsAsCanonicalQuestionsJson() throws Exception {
        RobinChatRequest.RobinChatMessage message = new RobinChatRequest.RobinChatMessage(
            "assistant",
            null,
            List.of(
                new QuestionDraft(
                    "What is the capital of France?",
                    QuestionType.SINGLE,
                    new String[] { "Paris", "Berlin" },
                    new int[] { 0 },
                    new String[] { "Correct.", "Wrong." },
                    "",
                    null,
                    null,
                    null
                )
            )
        );

        String json = aiAssistantService.transcriptContent(message);

        String expected = """
            {
                "questions": [
                    {
                        "question": "What is the capital of France?",
                        "questionType": "single",
                        "answers": ["Paris", "Berlin"],
                        "correctAnswers": [0],
                        "explanations": ["Correct.", "Wrong."],
                        "questionExplanation": ""
                    }
                ]
            }
            """;
        assertEquals(objectMapper.readTree(expected), objectMapper.readTree(json));
    }

    @Test
    void transcriptContentReturnsPlainContentWhenNoDrafts() {
        RobinChatRequest.RobinChatMessage message = new RobinChatRequest.RobinChatMessage(
            "user",
            "Add one answer",
            null
        );
        assertEquals("Add one answer", aiAssistantService.transcriptContent(message));
    }

    @Test
    void transcriptContentReturnsEmptyStringForNullContentAndNoDrafts() {
        RobinChatRequest.RobinChatMessage message = new RobinChatRequest.RobinChatMessage("assistant", null, null);
        assertEquals("", aiAssistantService.transcriptContent(message));
    }

    @Test
    void findChatDuplicateMatchesExactTextWithoutEmbeddings() {
        AiAssistantService.DuplicateMatch match = aiAssistantService.findChatDuplicate(
            chatResponse(
                "Which country is the largest producer of coffee?",
                new String[] { "a", "b" },
                new int[] { 0 },
                "single"
            ),
            // Different casing and trailing punctuation still normalize to a match.
            List.of("which country is the LARGEST producer of coffee?!"),
            List.of()
        );

        assertNotNull(match);
        assertEquals("which country is the LARGEST producer of coffee?!", match.matchedQuestion());
    }

    @Test
    void findChatDuplicateReturnsNullWhenTextDiffersAndNoEmbeddings() {
        AiAssistantService.DuplicateMatch match = aiAssistantService.findChatDuplicate(
            chatResponse("What is the capital of France?", new String[] { "a", "b" }, new int[] { 0 }, "single"),
            List.of("Which country is the largest producer of coffee?"),
            List.of()
        );

        assertNull(match);
    }

    @Test
    void duplicateNoticeUsesSingularForOneQuestion() {
        String notice = AiAssistantService.duplicateNotice(List.of("Which country is the largest producer of coffee?"));

        assertTrue(notice.contains("one question"));
        assertTrue(notice.contains("Which country is the largest producer of coffee?"));
    }

    @Test
    void duplicateNoticeUsesPluralAndJoinsQuestions() {
        String notice = AiAssistantService.duplicateNotice(List.of("First question", "Second question"));

        assertTrue(notice.contains("2 questions"));
        assertTrue(notice.contains("First question; Second question"));
    }

    @Test
    void duplicateNoticeIsNullWhenNothingFiltered() {
        assertNull(AiAssistantService.duplicateNotice(List.of()));
    }

    private static AiAssistantService.AssistantResponse chatResponse(
        String question,
        String[] answers,
        int[] correctAnswers,
        String questionType
    ) {
        String[] explanations = new String[answers.length];
        Arrays.fill(explanations, "");
        return new AiAssistantService.AssistantResponse(
            question,
            answers,
            correctAnswers,
            explanations,
            null,
            null,
            questionType,
            null,
            null
        );
    }

    private static void assertGeneralChoiceDraft(QuestionDraft draft) {
        assertNotNull(draft.question());
        assertFalse(draft.question().isBlank(), "Expected a non-empty question");
        assertNotNull(draft.answers());
        assertTrue(draft.answers().length >= 2, "Expected at least 2 answers");
        assertNotNull(draft.correctAnswers());
        assertTrue(draft.correctAnswers().length >= 1, "Expected at least 1 correct answer");
        assertNotNull(draft.explanations());
        assertEquals(draft.answers().length, draft.explanations().length, "Expected one explanation slot per answer");

        for (int index : draft.correctAnswers()) {
            assertTrue(index >= 0, "Expected non-negative correct answer indexes");
            assertTrue(
                index < draft.answers().length,
                "Expected correct answer indexes to stay within answers array bounds"
            );
        }
    }

    private Question withUsableEmbedding(Question question, double[] embedding) {
        question.setEmbedding(embedding);
        question.setEmbeddingModel(embeddingModel);
        question.setEmbeddingTextHash(QuestionEmbeddingText.hash(question.getQuestion()));
        return question;
    }
}
