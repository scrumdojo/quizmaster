package cz.scrumdojo.quizmaster.workspace;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.quiz.Cohort;
import cz.scrumdojo.quizmaster.quiz.CohortRepository;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
public class WorkspaceQuizControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private CohortRepository cohortRepository;

    @Test
    public void getWorkspaceQuizzesNotFound() throws Exception {
        mockMvc.perform(get("/api/workspaces/{guid}/quizzes", "non-existent-guid")).andExpect(status().isNotFound());
    }

    @Test
    public void getWorkspaceQuizzes() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Quiz quiz1 = fixtures.save(fixtures.quizIn(workspace));
        Quiz quiz2 = fixtures.save(fixtures.quizIn(workspace));
        fixtures.save(fixtures.quiz()); // Quiz without workspace

        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes", workspace.getGuid()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalPages").value(1))
            .andExpect(jsonPath("$.number").value(0))
            .andExpect(jsonPath("$.content.length()").value(2))
            .andExpect(jsonPath("$.content[0].id").value(quiz2.getId()))
            .andExpect(jsonPath("$.content[1].id").value(quiz1.getId()));
    }

    @Test
    public void createQuizInWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        var result = mockMvc
            .perform(
                post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "title": "New Quiz",
                            "description": "A quiz",
                            "startAt": "2026-04-14T10:00",
                            "endAt": "2026-04-14T23:00",
                            "questionIds": [%d],
                            "mode": "learn",
                            "passScore": 80,
                            "randomQuestionCount": 1
                        }
                        """.formatted(question.getId())
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andReturn();

        Integer quizId = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.id");

        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quizId))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {"id": %d}
                    """.formatted(quizId)
                )
            )
            .andExpect(jsonPath("$.questions.length()").value(1));

        Quiz savedQuiz = latestQuiz();
        assertThat(savedQuiz.getStartAt()).isEqualTo(LocalDateTime.of(2026, 4, 14, 10, 0));
        assertThat(savedQuiz.getEndAt()).isEqualTo(LocalDateTime.of(2026, 4, 14, 23, 0));
    }

    @Test
    public void createCohortPersistsAndReturnsGuid() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc
            .perform(
                post("/api/workspaces/{wid}/quizzes/{id}/cohorts", workspace.getGuid(), quiz.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"name": "Alpha"}
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.guid").isString())
            .andExpect(jsonPath("$.name").value("Alpha"));

        assertThat(cohortRepository.findByQuizIdOrderByName(quiz.getId()))
            .extracting(cohort -> cohort.getName())
            .containsExactly("Alpha");
    }

    @Test
    public void createCohortRejectsBlankName() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc
            .perform(
                post("/api/workspaces/{wid}/quizzes/{id}/cohorts", workspace.getGuid(), quiz.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"name": "   "}
                        """
                    )
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("empty-cohort-name"));

        assertThat(cohortRepository.findByQuizIdOrderByName(quiz.getId())).isEmpty();
    }

    @Test
    public void createCohortRejectsDuplicateName() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(question)
                .workspaceGuid(workspace.getGuid())
                .cohorts(List.of(Cohort.builder().name("Alpha").build()))
                .build()
        );

        mockMvc
            .perform(
                post("/api/workspaces/{wid}/quizzes/{id}/cohorts", workspace.getGuid(), quiz.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"name": "Alpha"}
                        """
                    )
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("duplicate-cohort-name"));

        assertThat(cohortRepository.findByQuizIdOrderByName(quiz.getId()))
            .extracting(cohort -> cohort.getName())
            .containsExactly("Alpha");
    }

    @Test
    public void createCohortMissingWorkspaceReturns404() throws Exception {
        mockMvc
            .perform(
                post("/api/workspaces/{wid}/quizzes/{id}/cohorts", "non-existent-guid", -1)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"name": "Alpha"}
                        """
                    )
            )
            .andExpect(status().isNotFound());
    }

    @Test
    public void updateQuizPreservesCohortsWhenCohortNamesAbsent() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(question)
                .workspaceGuid(workspace.getGuid())
                .cohorts(List.of(Cohort.builder().name("Alpha").build()))
                .build()
        );

        mockMvc
            .perform(
                put("/api/workspaces/{wid}/quizzes/{id}", workspace.getGuid(), quiz.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "title": "%s",
                            "description": "%s",
                            "questionIds": [%d],
                            "mode": "learn",
                            "passScore": 80
                        }
                        """.formatted(quiz.getTitle(), quiz.getDescription(), question.getId())
                    )
            )
            .andExpect(status().isOk());

        assertThat(cohortRepository.findByQuizIdOrderByName(quiz.getId()))
            .extracting(cohort -> cohort.getName())
            .containsExactly("Alpha");
    }

    @Test
    public void createCohortMissingQuizReturns404() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc
            .perform(
                post("/api/workspaces/{wid}/quizzes/{id}/cohorts", workspace.getGuid(), -1)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"name": "Alpha"}
                        """
                    )
            )
            .andExpect(status().isNotFound());
    }

    @Test
    public void getQuizFromWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace1));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace1.getGuid()).build());

        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}", workspace2.getGuid(), quiz.getId()))
            .andExpect(status().isNotFound());
    }

    @Test
    public void getWorkspaceQuizReturnsAllQuestionsForRandomQuiz() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace).question("Q1"));
        Question q2 = fixtures.save(fixtures.questionIn(workspace).question("Q2"));
        Question q3 = fixtures.save(fixtures.questionIn(workspace).question("Q3"));
        Quiz quiz = fixtures.save(
            fixtures.quiz(q1, q2, q3).workspaceGuid(workspace.getGuid()).randomQuestionCount(2).build()
        );

        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.questions.length()").value(3))
            .andExpect(jsonPath("$.questions[0].correctAnswers").exists());
    }

    @Test
    public void createQuizInWorkspaceWithOnlyStartDate() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc
            .perform(
                post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "title": "New Quiz",
                            "description": "A quiz",
                            "startAt": "2026-04-14T10:00",
                            "questionIds": [%d],
                            "mode": "learn",
                            "passScore": 80,
                            "randomQuestionCount": 1
                        }
                        """.formatted(question.getId())
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber());

        Quiz savedQuiz = latestQuiz();
        assertThat(savedQuiz.getStartAt()).isEqualTo(LocalDateTime.of(2026, 4, 14, 10, 0));
        assertThat(savedQuiz.getEndAt()).isNull();
    }

    @Test
    public void createQuizInWorkspaceWithOnlyEndDate() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc
            .perform(
                post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "title": "New Quiz",
                            "description": "A quiz",
                            "endAt": "2026-04-14T23:00",
                            "questionIds": [%d],
                            "mode": "learn",
                            "passScore": 80,
                            "randomQuestionCount": 1
                        }
                        """.formatted(question.getId())
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber());

        Quiz savedQuiz = latestQuiz();
        assertThat(savedQuiz.getStartAt()).isNull();
        assertThat(savedQuiz.getEndAt()).isEqualTo(LocalDateTime.of(2026, 4, 14, 23, 0));
    }

    @Test
    public void updateQuizInWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc
            .perform(
                put("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "title": "Updated Quiz",
                            "description": "Updated description",
                            "startAt": "2026-04-15T08:30",
                            "endAt": "2026-04-15T18:00",
                            "questionIds": [%d],
                            "mode": "exam",
                            "passScore": 90,
                            "randomQuestionCount": 1
                        }
                        """.formatted(question.getId())
                    )
            )
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {"id": %d}
                    """.formatted(quiz.getId())
                )
            );

        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {
                        "title": "Updated Quiz",
                        "startAt": "2026-04-15T08:30:00",
                        "endAt": "2026-04-15T18:00:00"
                    }
                    """
                )
            );
    }

    @Test
    public void updateQuizInWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace1));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace1.getGuid()).build());

        mockMvc
            .perform(
                put("/api/workspaces/{guid}/quizzes/{id}", workspace2.getGuid(), quiz.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "title": "Updated Quiz",
                            "description": "Updated",
                            "questionIds": [%d],
                            "mode": "exam",
                            "passScore": 90,
                            "randomQuestionCount": 1
                        }
                        """.formatted(question.getId())
                    )
            )
            .andExpect(status().isNotFound());
    }

    @Test
    public void createQuizBlankTitleReturnsBadRequest() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());

        mockMvc
            .perform(
                post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "title": "  ",
                            "description": "A quiz",
                            "questionIds": [],
                            "mode": "learn",
                            "passScore": 80,
                            "randomQuestionCount": 0
                        }
                        """
                    )
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    public void createQuizRejectsQuestionFromAnotherWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Workspace otherWorkspace = fixtures.save(fixtures.workspace());
        Question foreignQuestion = fixtures.save(fixtures.questionIn(otherWorkspace));

        mockMvc
            .perform(
                post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "title": "Foreign question",
                            "description": "Should fail",
                            "questionIds": [%d],
                            "mode": "learn",
                            "passScore": 80,
                            "randomQuestionCount": 1
                        }
                        """.formatted(foreignQuestion.getId())
                    )
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    public void updateQuizRejectsQuestionFromAnotherWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Workspace otherWorkspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Question foreignQuestion = fixtures.save(fixtures.questionIn(otherWorkspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc
            .perform(
                put("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "title": "Foreign question update",
                            "description": "Should fail",
                            "questionIds": [%d],
                            "mode": "learn",
                            "passScore": 80,
                            "randomQuestionCount": 1
                        }
                        """.formatted(foreignQuestion.getId())
                    )
            )
            .andExpect(status().isBadRequest());
    }

    @Test
    public void createQuizIgnoresRequestBodyWorkspaceGuid() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Workspace bodyWorkspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc
            .perform(
                post("/api/workspaces/{guid}/quizzes", workspace.getGuid())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "title": "Body workspace mismatch",
                            "description": "Path workspace wins",
                            "questionIds": [%d],
                            "mode": "learn",
                            "passScore": 80,
                            "workspaceGuid": "%s",
                            "randomQuestionCount": 1
                        }
                        """.formatted(question.getId(), bodyWorkspace.getGuid())
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber());

        assertThat(latestQuiz().getWorkspaceGuid()).isEqualTo(workspace.getGuid());
    }

    @Test
    public void createQuizInNonExistentWorkspaceReturns404() throws Exception {
        mockMvc
            .perform(
                post("/api/workspaces/{guid}/quizzes", "non-existent-guid")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "title": "Quiz",
                            "description": "A quiz",
                            "questionIds": [],
                            "mode": "learn",
                            "passScore": 80,
                            "randomQuestionCount": 0
                        }
                        """
                    )
            )
            .andExpect(status().isNotFound());
    }

    @Test
    public void deleteQuizFromWorkspace() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc
            .perform(delete("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/quiz/{id}", quiz.getId())).andExpect(status().isNotFound());
    }

    @Test
    public void deleteQuizAlsoCascadesAttempts() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());
        Attempt attempt = fixtures.save(fixtures.attempt(quiz));

        mockMvc
            .perform(delete("/api/workspaces/{guid}/quizzes/{id}", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isNoContent());

        assertThat(attemptRepository.findById(attempt.getId())).isEmpty();
    }

    @Test
    public void deleteQuizInWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace1));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace1.getGuid()).build());

        mockMvc
            .perform(delete("/api/workspaces/{guid}/quizzes/{id}", workspace2.getGuid(), quiz.getId()))
            .andExpect(status().isNotFound());
    }

    @Test
    public void createDryRunPersistsFlaggedAttempt() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures.quiz(question).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );

        var result = mockMvc
            .perform(post("/api/workspaces/{guid}/quizzes/{id}/dry-runs", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.attemptId").isNumber())
            .andExpect(jsonPath("$.questions.length()").value(1))
            .andReturn();

        Integer attemptId = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.attemptId");
        Attempt persisted = attemptRepository.findById(attemptId).orElseThrow();
        assertThat(persisted.getIsDryRun()).isTrue();
        assertThat(persisted.getQuizId()).isEqualTo(quiz.getId());
    }

    @Test
    public void createDryRunBypassesPreAvailabilityWindow() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(question)
                .workspaceGuid(workspace.getGuid())
                .randomQuestionCount(null)
                .startAt(LocalDateTime.now().plusDays(1))
                .endAt(LocalDateTime.now().plusDays(2))
                .build()
        );

        mockMvc
            .perform(post("/api/workspaces/{guid}/quizzes/{id}/dry-runs", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk());
    }

    @Test
    public void createDryRunBypassesPostAvailabilityWindow() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(question)
                .workspaceGuid(workspace.getGuid())
                .randomQuestionCount(null)
                .startAt(LocalDateTime.now().minusDays(2))
                .endAt(LocalDateTime.now().minusDays(1))
                .build()
        );

        mockMvc
            .perform(post("/api/workspaces/{guid}/quizzes/{id}/dry-runs", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk());
    }

    @Test
    public void createDryRunResponseDoesNotLeakAuthoringFields() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures.quiz(question).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );

        mockMvc
            .perform(post("/api/workspaces/{guid}/quizzes/{id}/dry-runs", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.questions[0].correctAnswers").doesNotExist())
            .andExpect(jsonPath("$.questions[0].explanations").doesNotExist());
    }

    @Test
    public void createDryRunInWrongWorkspaceReturns404() throws Exception {
        Workspace workspace1 = fixtures.save(fixtures.workspace());
        Workspace workspace2 = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace1));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace1.getGuid()).build());

        mockMvc
            .perform(post("/api/workspaces/{guid}/quizzes/{id}/dry-runs", workspace2.getGuid(), quiz.getId()))
            .andExpect(status().isNotFound());
    }

    @Test
    public void createDryRunInNonExistentWorkspaceReturns404() throws Exception {
        mockMvc
            .perform(post("/api/workspaces/{guid}/quizzes/{id}/dry-runs", "non-existent-guid", -1))
            .andExpect(status().isNotFound());
    }

    private Quiz latestQuiz() {
        return quizRepository.findAll().stream().max(Comparator.comparing(Quiz::getId)).orElseThrow();
    }
}
