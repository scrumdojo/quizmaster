package cz.scrumdojo.quizmaster.aiassistant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import cz.scrumdojo.quizmaster.question.QuestionType;
import cz.scrumdojo.quizmaster.workspace.Workspace;
import java.util.Arrays;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Tag("ai")
class AiAssistantEmbeddingDuplicateAvoidanceTest {

    private static final String EXISTING_QUESTION = "Which country is the largest producer of coffee?";

    @Autowired
    private AiAssistantService aiAssistantService;

    @Autowired
    private QuestionEmbeddingService questionEmbeddingService;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TestFixtures fixtures;

    @Value("${ai.token:}")
    private String apiToken;

    @Test
    void singleGenerationAvoidsExistingEmbeddedWorkspaceQuestion() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        Workspace workspace = workspaceWithEmbeddedQuestion(EXISTING_QUESTION);

        QuestionResponse response = aiAssistantService.generateQuestion(
            "Generate an exact question: " + EXISTING_QUESTION,
            "single",
            workspace.getGuid()
        );

        assertGeneralChoiceResponse(response);
        assertThat(normalize(response.question())).isNotEqualTo(normalize(EXISTING_QUESTION));
    }

    @Test
    void singleGenerationExcludesQuestionBeingEditedFromDuplicateComparisons() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        Workspace workspace = workspaceWithEmbeddedQuestion(EXISTING_QUESTION);
        Question editedQuestion = questionRepository.findByWorkspaceGuidOrderByIdDesc(workspace.getGuid()).getFirst();

        QuestionResponse response = aiAssistantService.generateQuestion(
            "Improve this exact question without changing its meaning: " + EXISTING_QUESTION,
            "single",
            workspace.getGuid(),
            editedQuestion.getId()
        );

        assertGeneralChoiceResponse(response);
    }

    @Test
    void batchGenerationAvoidsExistingEmbeddedWorkspaceQuestion() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        Workspace workspace = workspaceWithEmbeddedQuestion(EXISTING_QUESTION);

        QuestionResponse[] responses = aiAssistantService.generateQuestions(
            "Generate 2 single-choice questions about coffee. Include the exact question: " + EXISTING_QUESTION,
            "single",
            workspace.getGuid()
        );

        assertThat(responses).hasSizeGreaterThanOrEqualTo(1);
        assertThat(
            Arrays.stream(responses)
                .map(QuestionResponse::question)
                .map(AiAssistantEmbeddingDuplicateAvoidanceTest::normalize)
        ).doesNotContain(normalize(EXISTING_QUESTION));
    }

    private Workspace workspaceWithEmbeddedQuestion(String questionText) {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.questionIn(workspace).question(questionText).build();
        questionEmbeddingService.embedForSave(question);
        questionRepository.save(question);
        return workspace;
    }

    private static void assertGeneralChoiceResponse(QuestionResponse response) {
        assertThat(response.question()).isNotBlank();
        assertThat(response.answers()).hasSizeGreaterThanOrEqualTo(2);
        assertThat(response.correctAnswers()).hasSize(1);
        assertThat(response.explanations()).hasSize(response.answers().length);
        assertThat(response.questionType()).isEqualTo(QuestionType.SINGLE);
    }

    private static String normalize(String value) {
        return value.trim().toLowerCase().replaceAll("[^\\p{L}\\p{N}]+", " ").replaceAll("\\s+", " ").trim();
    }
}
