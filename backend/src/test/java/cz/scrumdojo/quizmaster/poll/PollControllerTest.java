package cz.scrumdojo.quizmaster.poll;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.workspace.Workspace;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
public class PollControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    private Integer createPoll(String workspaceGuid) throws Exception {
        var result = mockMvc
            .perform(
                post("/api/workspaces/{guid}/polls", workspaceGuid)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "question": "How often do you run retrospectives?",
                            "answers": ["Weekly", "Bi-weekly", "Monthly"]
                        }
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    @Test
    public void getPollDetailInWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Integer pollId = createPoll(workspace.getGuid());

        mockMvc
            .perform(get("/api/workspaces/{guid}/polls/{id}", workspace.getGuid(), pollId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(pollId))
            .andExpect(jsonPath("$.question").value("How often do you run retrospectives?"))
            .andExpect(jsonPath("$.answers[0]").value("Weekly"))
            .andExpect(jsonPath("$.answers[1]").value("Bi-weekly"))
            .andExpect(jsonPath("$.answers[2]").value("Monthly"));
    }

    @Test
    public void getPollDetailFromWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Integer pollId = createPoll(workspace1.getGuid());

        mockMvc
            .perform(get("/api/workspaces/{guid}/polls/{id}", workspace2.getGuid(), pollId))
            .andExpect(status().isNotFound());
    }

    @Test
    public void getPollDetailForMissingPollReturns404() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc
            .perform(get("/api/workspaces/{guid}/polls/{id}", workspace.getGuid(), 999_999))
            .andExpect(status().isNotFound());
    }

    @Test
    public void getPollDetailInNonExistentWorkspaceReturns404() throws Exception {
        mockMvc
            .perform(get("/api/workspaces/{guid}/polls/{id}", "non-existent-guid", 1))
            .andExpect(status().isNotFound());
    }

    @Test
    public void createPollInWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc
            .perform(
                post("/api/workspaces/{guid}/polls", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "question": "How often do you run retrospectives?",
                            "answers": ["Weekly", "Bi-weekly", "Monthly"]
                        }
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber());
    }

    @Test
    public void createPollBlankQuestionReturnsBadRequest() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc
            .perform(
                post("/api/workspaces/{guid}/polls", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "question": "   ",
                            "answers": ["A", "B"]
                        }
                        """
                    )
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    public void createPollWithLessThanTwoAnswersReturnsBadRequest() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc
            .perform(
                post("/api/workspaces/{guid}/polls", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "question": "How often do you run retrospectives?",
                            "answers": ["Weekly"]
                        }
                        """
                    )
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    public void createPollWithBlankAnswerReturnsBadRequest() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc
            .perform(
                post("/api/workspaces/{guid}/polls", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "question": "How often do you run retrospectives?",
                            "answers": ["Weekly", "   "]
                        }
                        """
                    )
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    public void createPollInNonExistentWorkspaceReturns404() throws Exception {
        mockMvc
            .perform(
                post("/api/workspaces/{guid}/polls", "non-existent-guid")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "question": "How often do you run retrospectives?",
                            "answers": ["Weekly", "Bi-weekly"]
                        }
                        """
                    )
            )
            .andExpect(status().isNotFound());
    }
}
