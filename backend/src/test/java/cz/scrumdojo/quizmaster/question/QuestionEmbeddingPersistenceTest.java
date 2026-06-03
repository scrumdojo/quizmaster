package cz.scrumdojo.quizmaster.question;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.aiassistant.QuestionEmbeddingText;
import cz.scrumdojo.quizmaster.common.IdResponse;
import cz.scrumdojo.quizmaster.workspace.Workspace;
import java.time.Duration;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Tag("ai")
class QuestionEmbeddingPersistenceTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TestFixtures fixtures;

    @Value("${ai.token:}")
    private String apiToken;

    @Value("${ai.embedding.model:openai/text-embedding-3-small}")
    private String embeddingModel;

    @Test
    void creatingQuestionStoresEmbeddingMetadata() throws Exception {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        Workspace workspace = fixtures.save(fixtures.workspace());

        IdResponse response = objectMapper.readValue(
            mockMvc
                .perform(
                    post("/api/workspaces/{guid}/questions", workspace.getGuid())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(questionJson("Which country is the largest producer of coffee?"))
                )
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            IdResponse.class
        );

        Question question = waitForEmbedding(response.id());
        assertThat(question.getEmbedding()).isNotEmpty();
        assertThat(question.getEmbeddingModel()).isEqualTo(embeddingModel);
        assertThat(question.getEmbeddingTextHash()).isEqualTo(
            QuestionEmbeddingText.hash("Which country is the largest producer of coffee?")
        );
    }

    @Test
    void updatingQuestionRefreshesEmbeddingHash() throws Exception {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace).question("What is Scrum?"));

        mockMvc
            .perform(
                patch("/api/workspaces/{guid}/questions/{id}", workspace.getGuid(), question.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(questionJson("What is Kanban?"))
            )
            .andExpect(status().isOk());

        Question updated = waitForEmbedding(question.getId());
        assertThat(updated.getEmbedding()).isNotEmpty();
        assertThat(updated.getEmbeddingModel()).isEqualTo(embeddingModel);
        assertThat(updated.getEmbeddingTextHash()).isEqualTo(QuestionEmbeddingText.hash("What is Kanban?"));
        assertThat(updated.getEmbeddingTextHash()).isNotEqualTo(QuestionEmbeddingText.hash("What is Scrum?"));
    }

    private Question waitForEmbedding(Integer questionId) throws InterruptedException {
        long deadline = System.nanoTime() + Duration.ofSeconds(15).toNanos();
        while (System.nanoTime() < deadline) {
            Question question = questionRepository.findById(questionId).orElseThrow();
            if (question.getEmbedding() != null && question.getEmbedding().length > 0) {
                return question;
            }
            Thread.sleep(200);
        }
        return questionRepository.findById(questionId).orElseThrow();
    }

    private static String questionJson(String question) {
        return """
        {
            "question": "%s",
            "answers": ["Correct answer", "Incorrect answer"],
            "correctAnswers": [0],
            "explanations": ["Yes", "No"],
            "isEasy": false,
            "questionType": "single"
        }
        """.formatted(question);
    }
}
