package cz.scrumdojo.quizmaster.poll;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

    private Integer getAnswerId(String workspaceGuid, Integer pollId, int answerIndex) throws Exception {
        var result = mockMvc
            .perform(get("/api/workspaces/{guid}/polls/{id}", workspaceGuid, pollId))
            .andExpect(status().isOk())
            .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.answers[%d].id".formatted(answerIndex));
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
            .andExpect(jsonPath("$.answers[0].id").isNumber())
            .andExpect(jsonPath("$.answers[0].text").value("Weekly"))
            .andExpect(jsonPath("$.answers[1].id").isNumber())
            .andExpect(jsonPath("$.answers[1].text").value("Bi-weekly"))
            .andExpect(jsonPath("$.answers[2].id").isNumber())
            .andExpect(jsonPath("$.answers[2].text").value("Monthly"));
    }

    @Test
    public void getPollsInWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        createPoll(workspace.getGuid());
        createPoll(workspace.getGuid());

        mockMvc
            .perform(get("/api/workspaces/{guid}/polls", workspace.getGuid()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").isNumber())
            .andExpect(jsonPath("$[0].question").value("How often do you run retrospectives?"))
            .andExpect(jsonPath("$[0].answers").doesNotExist())
            .andExpect(jsonPath("$[1].id").isNumber())
            .andExpect(jsonPath("$[1].question").value("How often do you run retrospectives?"))
            .andExpect(jsonPath("$[1].answers").doesNotExist());
    }

    @Test
    public void getPollsInWorkspaceDoesNotIncludePollsFromOtherWorkspace() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        createPoll(workspace1.getGuid());
        createPoll(workspace2.getGuid());

        mockMvc
            .perform(get("/api/workspaces/{guid}/polls", workspace1.getGuid()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    public void getPollsInNonExistentWorkspaceReturns404() throws Exception {
        mockMvc.perform(get("/api/workspaces/{guid}/polls", "non-existent-guid")).andExpect(status().isNotFound());
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
    public void getPollResultsWithoutVotesReturnsZeroCounts() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Integer pollId = createPoll(workspace.getGuid());

        mockMvc
            .perform(get("/api/workspaces/{guid}/polls/{id}/results", workspace.getGuid(), pollId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.pollId").value(pollId))
            .andExpect(jsonPath("$.answers[0].answerId").isNumber())
            .andExpect(jsonPath("$.answers[0].text").value("Weekly"))
            .andExpect(jsonPath("$.answers[0].voteCount").value(0))
            .andExpect(jsonPath("$.answers[1].text").value("Bi-weekly"))
            .andExpect(jsonPath("$.answers[1].voteCount").value(0))
            .andExpect(jsonPath("$.answers[2].text").value("Monthly"))
            .andExpect(jsonPath("$.answers[2].voteCount").value(0));
    }

    @Test
    public void getPollResultsAggregatesVotesPerAnswer() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Integer pollId = createPoll(workspace.getGuid());
        Integer firstAnswerId = getAnswerId(workspace.getGuid(), pollId, 0);
        Integer secondAnswerId = getAnswerId(workspace.getGuid(), pollId, 1);

        vote(pollId, firstAnswerId);
        vote(pollId, firstAnswerId);
        vote(pollId, secondAnswerId);

        mockMvc
            .perform(get("/api/workspaces/{guid}/polls/{id}/results", workspace.getGuid(), pollId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.pollId").value(pollId))
            .andExpect(jsonPath("$.answers[0].answerId").value(firstAnswerId))
            .andExpect(jsonPath("$.answers[0].text").value("Weekly"))
            .andExpect(jsonPath("$.answers[0].voteCount").value(2))
            .andExpect(jsonPath("$.answers[1].answerId").value(secondAnswerId))
            .andExpect(jsonPath("$.answers[1].text").value("Bi-weekly"))
            .andExpect(jsonPath("$.answers[1].voteCount").value(1))
            .andExpect(jsonPath("$.answers[2].text").value("Monthly"))
            .andExpect(jsonPath("$.answers[2].voteCount").value(0));
    }

    @Test
    public void getPollResultsFromWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Integer pollId = createPoll(workspace1.getGuid());

        mockMvc
            .perform(get("/api/workspaces/{guid}/polls/{id}/results", workspace2.getGuid(), pollId))
            .andExpect(status().isNotFound());
    }

    @Test
    public void getPollResultsForMissingPollReturns404() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc
            .perform(get("/api/workspaces/{guid}/polls/{id}/results", workspace.getGuid(), 999_999))
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
    public void createPollWithAnswerImagesStoresImageUrlPerAnswer() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        Integer pollId = JsonPath.read(
            mockMvc
                .perform(
                    post("/api/workspaces/{guid}/polls", workspace.getGuid())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                            """
                            {
                                "question": "Which retro format do you prefer?",
                                "answers": ["Starfish", "4Ls"],
                                "answerImages": ["https://example.com/starfish.png", null]
                            }
                            """
                        )
                )
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            "$.id"
        );

        mockMvc
            .perform(get("/api/workspaces/{guid}/polls/{id}", workspace.getGuid(), pollId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.answers[0].text").value("Starfish"))
            .andExpect(jsonPath("$.answers[0].imageUrl").value("https://example.com/starfish.png"))
            .andExpect(jsonPath("$.answers[1].text").value("4Ls"))
            .andExpect(jsonPath("$.answers[1].imageUrl").doesNotExist());
    }

    @Test
    public void createPollWithoutAnswerImagesLeavesImageUrlAbsent() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Integer pollId = createPoll(workspace.getGuid());

        mockMvc
            .perform(get("/api/workspaces/{guid}/polls/{id}", workspace.getGuid(), pollId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.answers[0].imageUrl").doesNotExist());
    }

    @Test
    public void createPollAnswerWithOnlyImageAndNoTextIsValid() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc
            .perform(
                post("/api/workspaces/{guid}/polls", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "question": "Which retro format do you prefer?",
                            "answers": ["", "4Ls"],
                            "answerImages": ["https://example.com/starfish.png", null]
                        }
                        """
                    )
            )
            .andExpect(status().isOk());
    }

    @Test
    public void updatePollAnswerWithOnlyImageAndNoTextIsValid() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Integer pollId = createPoll(workspace.getGuid());
        Integer firstAnswerId = getAnswerId(workspace.getGuid(), pollId, 0);
        Integer secondAnswerId = getAnswerId(workspace.getGuid(), pollId, 1);

        mockMvc
            .perform(
                put("/api/workspaces/{guid}/polls/{id}", workspace.getGuid(), pollId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "question": "How often do you run retrospectives?",
                            "answers": [
                                {"id": %d, "text": "", "imageUrl": "https://example.com/weekly.png"},
                                {"id": %d, "text": "Bi-weekly", "imageUrl": null}
                            ]
                        }
                        """.formatted(firstAnswerId, secondAnswerId)
                    )
            )
            .andExpect(status().isOk());

        mockMvc
            .perform(get("/api/workspaces/{guid}/polls/{id}", workspace.getGuid(), pollId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.answers[0].text").value(""))
            .andExpect(jsonPath("$.answers[0].imageUrl").value("https://example.com/weekly.png"));
    }

    @Test
    public void updatePollAnswerWithNeitherTextNorImageReturnsBadRequest() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Integer pollId = createPoll(workspace.getGuid());
        Integer firstAnswerId = getAnswerId(workspace.getGuid(), pollId, 0);
        Integer secondAnswerId = getAnswerId(workspace.getGuid(), pollId, 1);

        mockMvc
            .perform(
                put("/api/workspaces/{guid}/polls/{id}", workspace.getGuid(), pollId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "question": "How often do you run retrospectives?",
                            "answers": [
                                {"id": %d, "text": "", "imageUrl": null},
                                {"id": %d, "text": "Bi-weekly", "imageUrl": null}
                            ]
                        }
                        """.formatted(firstAnswerId, secondAnswerId)
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

    private void vote(Integer pollId, Integer answerId) throws Exception {
        mockMvc
            .perform(
                post("/api/poll/{id}/submit", pollId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            \"selectedAnswerId\": %d
                        }
                        """.formatted(answerId)
                    )
            )
            .andExpect(status().isNoContent());
    }
}
