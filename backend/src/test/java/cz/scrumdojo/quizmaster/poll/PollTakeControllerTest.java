package cz.scrumdojo.quizmaster.poll;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
public class PollTakeControllerTest {

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
            .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    private Integer getFirstAnswerId(String workspaceGuid, Integer pollId) throws Exception {
        var result = mockMvc
            .perform(get("/api/workspaces/{guid}/polls/{id}", workspaceGuid, pollId))
            .andExpect(status().isOk())
            .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.answers[0].id");
    }

    @Test
    public void getPollReturnsPublicDetail() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Integer pollId = createPoll(workspace.getGuid());

        mockMvc.perform(get("/api/poll/{id}", pollId)).andExpect(status().isOk());
    }

    @Test
    public void getPollForMissingPollReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/poll/{id}", 999_999)).andExpect(status().isNotFound());
    }

    @Test
    public void submitVoteByAnswerIdReturnsNoContent() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Integer pollId = createPoll(workspace.getGuid());
        Integer answerId = getFirstAnswerId(workspace.getGuid(), pollId);

        mockMvc
            .perform(
                post("/api/poll/{id}/submit", pollId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "selectedAnswerId": %d
                        }
                        """.formatted(answerId)
                    )
            )
            .andExpect(status().isNoContent());
    }

    @Test
    public void submitVoteForMissingPollReturnsNotFound() throws Exception {
        mockMvc
            .perform(
                post("/api/poll/{id}/submit", 999_999)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "selectedAnswerId": 1
                        }
                        """
                    )
            )
            .andExpect(status().isNotFound());
    }

    @Test
    public void submitVoteForUnknownAnswerReturnsBadRequest() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Integer pollId = createPoll(workspace.getGuid());

        mockMvc
            .perform(
                post("/api/poll/{id}/submit", pollId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "selectedAnswerId": 999999
                        }
                        """
                    )
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    public void submitSameVoteMultipleTimesReturnsNoContent() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Integer pollId = createPoll(workspace.getGuid());
        Integer answerId = getFirstAnswerId(workspace.getGuid(), pollId);

        mockMvc
            .perform(
                post("/api/poll/{id}/submit", pollId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "selectedAnswerId": %d
                        }
                        """.formatted(answerId)
                    )
            )
            .andExpect(status().isNoContent());

        mockMvc
            .perform(
                post("/api/poll/{id}/submit", pollId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "selectedAnswerId": %d
                        }
                        """.formatted(answerId)
                    )
            )
            .andExpect(status().isNoContent());
    }
}
