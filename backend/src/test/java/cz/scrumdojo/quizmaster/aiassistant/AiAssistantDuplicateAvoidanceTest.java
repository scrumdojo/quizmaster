package cz.scrumdojo.quizmaster.aiassistant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import cz.scrumdojo.quizmaster.question.QuestionType;
import cz.scrumdojo.quizmaster.workspace.Workspace;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Tag("ai")
class AiAssistantDuplicateAvoidanceTest {

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
    void generateQuestionAvoidsExistingWorkspaceQuestion() throws Exception {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        Workspace workspace = workspaceWithQuestion(EXISTING_QUESTION);

        QuestionResponse response = generateQuestion(
            "Generate an exact question: " + EXISTING_QUESTION,
            "single",
            workspace.getGuid()
        );

        assertGeneralChoiceResponse(response);
        assertThat(normalize(response.question())).isNotEqualTo(normalize(EXISTING_QUESTION));
    }

    @Test
    void generateQuestionWithoutWorkspaceGuidStillGeneratesQuestion() throws Exception {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        QuestionResponse response = generateQuestion("Generate a question about coffee", "single", null);

        assertGeneralChoiceResponse(response);
    }

    @Test
    void generateQuestionWithEmptyWorkspaceStillGeneratesQuestion() throws Exception {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        Workspace workspace = fixtures.save(fixtures.workspace());

        QuestionResponse response = generateQuestion("Generate a question about coffee", "single", workspace.getGuid());

        assertGeneralChoiceResponse(response);
    }

    private Workspace workspaceWithQuestion(String questionText) {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.questionIn(workspace).question(questionText).build();
        questionEmbeddingService.embedForSave(question);
        questionRepository.save(question);
        return workspace;
    }

    private QuestionResponse generateQuestion(String prompt, String questionType, String workspaceGuid)
        throws Exception {
        Method generate = AiAssistantService.class.getMethod(
            "generateQuestion",
            String.class,
            String.class,
            String.class
        );
        try {
            return (QuestionResponse) generate.invoke(aiAssistantService, prompt, questionType, workspaceGuid);
        } catch (InvocationTargetException e) {
            if (e.getTargetException() instanceof Exception target) {
                throw target;
            }
            throw e;
        }
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
