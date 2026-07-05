package cz.scrumdojo.quizmaster.aiassistant;

import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.workspace.Workspace;
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
public class AiAssistantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Value("${ai.token:}")
    private String apiToken;

    @Autowired
    private TestFixtures fixtures;

    @Tag("ai")
    @Test
    public void chatReturnsDraftsForSingleUserTurn() throws Exception {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc
            .perform(
                post("/api/workspaces/{guid}/ai-assistant/chat", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                            {
                                "messages": [
                                    {
                                        "role": "user",
                                        "content": "Ask one single-choice question about capital cities with 1 correct answer and 2 incorrect answers"
                                    }
                                ]
                            }
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.drafts").isArray())
            .andExpect(jsonPath("$.drafts.length()").value(1))
            .andExpect(jsonPath("$.drafts[0].question").isNotEmpty())
            .andExpect(jsonPath("$.drafts[0].questionType").value("single"))
            .andExpect(jsonPath("$.drafts[0].answers.length()").value(3))
            .andExpect(jsonPath("$.drafts[0].correctAnswers.length()").value(1))
            .andExpect(jsonPath("$.drafts[0].explanations.length()").value(3))
            .andExpect(jsonPath("$.notice").doesNotExist());
    }

    @Test
    public void chatWithoutMessagesReturnsBadRequest() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc
            .perform(
                post("/api/workspaces/{guid}/ai-assistant/chat", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                            {"messages": []}
                        """
                    )
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    public void chatEndingWithAssistantTurnReturnsBadRequest() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc
            .perform(
                post("/api/workspaces/{guid}/ai-assistant/chat", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                            {
                                "messages": [
                                    {"role": "user", "content": "Ask a question"},
                                    {"role": "assistant", "drafts": []}
                                ]
                            }
                        """
                    )
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    public void chatOnUnknownWorkspaceReturnsNotFound() throws Exception {
        mockMvc
            .perform(
                post("/api/workspaces/{guid}/ai-assistant/chat", "non-existent-guid")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                            {"messages": [{"role": "user", "content": "Ask a question"}]}
                        """
                    )
            )
            .andExpect(status().isNotFound());
    }
}
