package cz.scrumdojo.quizmaster.aiassistant;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
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

    @Value("${ai.token:}")
    private String apiToken;

    @Value("${ai.embedding.model}")
    private String embeddingModel;

    @Test
    void generateQuestionFailsOnEmptyPrompt() {
        assertThrows(ResponseStatusException.class, () -> aiAssistantService.generateQuestion("   ", "single"));
    }

    @Test
    void generateQuestionFailsOnMissingQuestionType() {
        assertThrows(ResponseStatusException.class, () -> aiAssistantService.generateQuestion("Topic", null));
        assertThrows(ResponseStatusException.class, () -> aiAssistantService.generateQuestion("Topic", "  "));
    }

    @Test
    void generateQuestionFailsOnUnknownQuestionType() {
        assertThrows(ResponseStatusException.class, () -> aiAssistantService.generateQuestion("Topic", "wat"));
    }

    @Test
    void generateQuestionsFailsOnEmptyPrompt() {
        assertThrows(ResponseStatusException.class, () -> aiAssistantService.generateQuestions("   ", "single"));
    }

    @Test
    void generateQuestionsFailsOnMissingQuestionType() {
        assertThrows(ResponseStatusException.class, () -> aiAssistantService.generateQuestions("Topic", null));
        assertThrows(ResponseStatusException.class, () -> aiAssistantService.generateQuestions("Topic", "  "));
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
    void generateSingleChoiceWithType() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Generate a question about capital cities and 2 incorrect answers",
            "single"
        );

        assertGeneralChoiceResponse(response);
        assertEquals(1, response.correctAnswers().length);
        assertEquals(QuestionType.SINGLE, response.questionType());
    }

    @Tag("ai")
    @Test
    void generateMultipleChoiceWithType() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Generate a question about European capitals with 2 correct answers and 2 incorrect answers",
            "multiple"
        );

        assertGeneralChoiceResponse(response);
        assertTrue(response.correctAnswers().length >= 2, "Expected at least 2 correct answers");
        assertEquals(QuestionType.MULTIPLE, response.questionType());
    }

    @Tag("ai")
    @Test
    void generateNumericalWithType() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Generate a numerical question about basic arithmetic",
            "numerical"
        );

        assertNotNull(response.question());
        assertFalse(response.question().isBlank());
        assertEquals(1, response.answers().length, "Numerical must have exactly 1 answer");
        assertDoesNotThrow(() -> Double.parseDouble(response.answers()[0].trim()));
        assertArrayEquals(new int[] { 0 }, response.correctAnswers());
        assertEquals(QuestionType.NUMERICAL, response.questionType());
    }

    @Tag("ai")
    @Test
    void generateMultipleCorrectAnswersWithSpecificCount() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Create a question on exoplanets with exactly 2 correct answers and exactly 2 incorrect answers.",
            "multiple"
        );

        assertFalse(response.question().isBlank());
        assertEquals(4, response.answers().length, "Expected exactly 4 answers");
        assertEquals(2, response.correctAnswers().length, "Expected exactly 2 correct answers");
    }

    @Tag("ai")
    @Test
    void generateSingleCorrectAnswerWithExactCount() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        var response = aiAssistantService.generateQuestion(
            "Create a question about European capitals with exactly 2 incorrect answers (3 answers total).",
            "single"
        );

        assertFalse(response.question().isBlank());
        assertEquals(3, response.answers().length, "Expected exactly 3 answers");
        assertEquals(1, response.correctAnswers().length, "Expected exactly 1 correct answer");
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
    void validateBatchResponses_valid() {
        assertDoesNotThrow(() ->
            AiAssistantService.validateBatchResponses(
                new AiAssistantService.AssistantResponse[] {
                    new AiAssistantService.AssistantResponse(
                        "Q1?",
                        new String[] { "a", "b" },
                        new int[] { 0 },
                        new String[] { "", "" },
                        null,
                        null
                    ),
                    new AiAssistantService.AssistantResponse(
                        "Q2?",
                        new String[] { "c", "d" },
                        new int[] { 1 },
                        new String[] { "", "" },
                        null,
                        null
                    ),
                },
                QuestionType.SINGLE
            )
        );
    }

    @Test
    void validateBatchResponses_requiresAtLeastTwoQuestions() {
        assertThrows(ResponseStatusException.class, () ->
            AiAssistantService.validateBatchResponses(
                new AiAssistantService.AssistantResponse[] {},
                QuestionType.SINGLE
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

    private static void assertGeneralChoiceResponse(QuestionResponse response) {
        assertNotNull(response.question());
        assertFalse(response.question().isBlank(), "Expected a non-empty question");
        assertNotNull(response.answers());
        assertTrue(response.answers().length >= 2, "Expected at least 2 answers");
        assertNotNull(response.correctAnswers());
        assertTrue(response.correctAnswers().length >= 1, "Expected at least 1 correct answer");
        assertNotNull(response.explanations());
        assertEquals(
            response.answers().length,
            response.explanations().length,
            "Expected one explanation slot per answer"
        );

        for (int index : response.correctAnswers()) {
            assertTrue(index >= 0, "Expected non-negative correct answer indexes");
            assertTrue(
                index < response.answers().length,
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
