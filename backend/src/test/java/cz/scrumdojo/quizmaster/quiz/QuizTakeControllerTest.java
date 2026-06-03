package cz.scrumdojo.quizmaster.quiz;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.jayway.jsonpath.JsonPath;
import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.attempt.AnswerStatus;
import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.workspace.Workspace;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
public class QuizTakeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private AttemptQuestionRepository attemptQuestionRepository;

    @Test
    public void getQuizReturnsMetadataWithoutLeakingQuestions() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Question q2 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(q1, q2)
                .workspaceGuid(workspace.getGuid())
                .startAt(LocalDateTime.of(2026, 4, 14, 10, 0))
                .endAt(LocalDateTime.of(2026, 4, 14, 23, 0))
                .randomQuestionCount(1)
                .build()
        );

        mockMvc
            .perform(get("/api/quiz/{id}", quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {
                        "title": "Test Quiz",
                        "description": "Test Description",
                        "startAt": "2026-04-14T10:00:00",
                        "endAt": "2026-04-14T23:00:00",
                        "mode": "learn",
                        "passScore": 85,
                        "randomQuestionCount": 1,
                        "questionCount": 1
                    }
                    """
                )
            )
            .andExpect(jsonPath("$.id").value(quiz.getId()))
            .andExpect(jsonPath("$.questions").doesNotExist());
    }

    @Test
    public void getQuizQuestionCountFallsBackToFullPoolWhenNoRandomSubset() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Question q2 = fixtures.save(fixtures.questionIn(workspace));
        Question q3 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures.quiz(q1, q2, q3).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );

        mockMvc
            .perform(get("/api/quiz/{id}", quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.questionCount").value(3))
            .andExpect(jsonPath("$.questions").doesNotExist());
    }

    @Test
    public void getQuizNotFound() throws Exception {
        mockMvc.perform(get("/api/quiz/{id}", -1)).andExpect(status().isNotFound());
    }

    @Test
    public void getQuizLeaderboardReturnsRankedCohortScoresFromFinishedAttempts() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace).question("Q1"));
        Question q2 = fixtures.save(fixtures.questionIn(workspace).question("Q2"));
        Question q3 = fixtures.save(fixtures.questionIn(workspace).question("Q3"));
        Question q4 = fixtures.save(fixtures.questionIn(workspace).question("Q4"));
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(q1, q2, q3, q4)
                .workspaceGuid(workspace.getGuid())
                .randomQuestionCount(null)
                .cohorts(
                    List.of(
                        Cohort.builder().name("Team Rocket").build(),
                        Cohort.builder().name("Scrum Ninjas").build(),
                        Cohort.builder().name("Retro Masters").build()
                    )
                )
                .build()
        );

        Attempt teamRocketAttempt = fixtures.save(
            fixtures.attempt(quiz).cohortGuid(quiz.getCohorts().get(0).getGuid()),
            q1,
            q2,
            q3,
            q4
        );
        fixtures.score(teamRocketAttempt, q1, AnswerStatus.CORRECT);
        fixtures.score(teamRocketAttempt, q2, AnswerStatus.CORRECT);
        fixtures.score(teamRocketAttempt, q3, AnswerStatus.CORRECT);
        fixtures.score(teamRocketAttempt, q4, AnswerStatus.CORRECT);

        Attempt scrumNinjasAttempt = fixtures.save(
            fixtures.attempt(quiz).cohortGuid(quiz.getCohorts().get(1).getGuid()),
            q1,
            q2,
            q3,
            q4
        );
        fixtures.score(scrumNinjasAttempt, q1, AnswerStatus.CORRECT);
        fixtures.score(scrumNinjasAttempt, q2, AnswerStatus.CORRECT);
        fixtures.score(scrumNinjasAttempt, q3, AnswerStatus.CORRECT);
        fixtures.score(scrumNinjasAttempt, q4, AnswerStatus.INCORRECT);

        Attempt retroMastersAttempt = fixtures.save(
            fixtures.attempt(quiz).cohortGuid(quiz.getCohorts().get(2).getGuid()),
            q1,
            q2,
            q3,
            q4
        );
        fixtures.score(retroMastersAttempt, q1, AnswerStatus.CORRECT);
        fixtures.score(retroMastersAttempt, q2, AnswerStatus.CORRECT);
        fixtures.score(retroMastersAttempt, q3, AnswerStatus.PARTIAL);
        fixtures.score(retroMastersAttempt, q4, AnswerStatus.INCORRECT);

        Attempt dryRunAttempt = fixtures.save(
            fixtures.attempt(quiz).cohortGuid(quiz.getCohorts().get(0).getGuid()).isDryRun(true),
            q1,
            q2,
            q3,
            q4
        );
        fixtures.score(dryRunAttempt, q1, AnswerStatus.INCORRECT);
        fixtures.score(dryRunAttempt, q2, AnswerStatus.INCORRECT);
        fixtures.score(dryRunAttempt, q3, AnswerStatus.INCORRECT);
        fixtures.score(dryRunAttempt, q4, AnswerStatus.INCORRECT);

        mockMvc
            .perform(get("/api/quiz/{id}/leaderboard", quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {
                        "cohorts": [
                            {"rank": 1, "cohort": "Team Rocket", "score": 100},
                            {"rank": 2, "cohort": "Scrum Ninjas", "score": 75},
                            {"rank": 3, "cohort": "Retro Masters", "score": 63}
                        ]
                    }
                    """
                )
            );
    }

    @Test
    public void getQuizLeaderboardNotFound() throws Exception {
        mockMvc.perform(get("/api/quiz/{id}/leaderboard", -1)).andExpect(status().isNotFound());
    }

    @Test
    public void getQuizLeaderboardOrdersTiedCohortsAlphabetically() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace).question("Q1"));
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(q1)
                .workspaceGuid(workspace.getGuid())
                .randomQuestionCount(null)
                .cohorts(
                    List.of(
                        Cohort.builder().name("Charlie").build(),
                        Cohort.builder().name("Alpha").build(),
                        Cohort.builder().name("Bravo").build()
                    )
                )
                .build()
        );

        for (int i = 0; i < 3; i++) {
            Attempt attempt = fixtures.save(fixtures.attempt(quiz).cohortGuid(quiz.getCohorts().get(i).getGuid()), q1);
            fixtures.score(attempt, q1, AnswerStatus.CORRECT);
        }

        mockMvc
            .perform(get("/api/quiz/{id}/leaderboard", quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {
                        "cohorts": [
                            {"rank": 1, "cohort": "Alpha", "score": 100},
                            {"rank": 2, "cohort": "Bravo", "score": 100},
                            {"rank": 3, "cohort": "Charlie", "score": 100}
                        ]
                    }
                    """
                )
            );
    }

    @Test
    public void createAttemptPersistsResolvedCohortIdForMatchingCohortGuid() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace).question("Q1"));
        Question q2 = fixtures.save(fixtures.questionIn(workspace).question("Q2"));
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(q1, q2)
                .workspaceGuid(workspace.getGuid())
                .cohorts(List.of(Cohort.builder().name("Alpha").build(), Cohort.builder().name("Beta").build()))
                .randomQuestionCount(null)
                .build()
        );
        String cohortGuid = quiz.getCohorts().getFirst().getGuid();

        var result = mockMvc
            .perform(
                post("/api/quiz/{id}/attempts", quiz.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "cohortGuid": "%s"
                        }
                        """.formatted(cohortGuid)
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.attemptId").isNumber())
            .andReturn();

        Integer attemptId = JsonPath.read(result.getResponse().getContentAsString(), "$.attemptId");
        var attempt = attemptRepository.findById(attemptId).orElseThrow();

        assertThat(attempt.getCohortGuid()).isEqualTo(quiz.getCohorts().getFirst().getGuid());
    }

    @Test
    public void createAttemptRejectsCohortGuidThatBelongsToDifferentQuiz() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace).question("Q1"));
        Question q2 = fixtures.save(fixtures.questionIn(workspace).question("Q2"));
        Quiz requestedQuiz = fixtures.save(
            fixtures
                .quiz(q1)
                .workspaceGuid(workspace.getGuid())
                .cohorts(List.of(Cohort.builder().name("Requested").build()))
                .randomQuestionCount(null)
                .build()
        );
        Quiz otherQuiz = fixtures.save(
            fixtures
                .quiz(q2)
                .workspaceGuid(workspace.getGuid())
                .cohorts(List.of(Cohort.builder().name("Foreign").build()))
                .randomQuestionCount(null)
                .build()
        );
        long attemptsBefore = attemptRepository.count();

        mockMvc
            .perform(
                post("/api/quiz/{id}/attempts", requestedQuiz.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "cohortGuid": "%s"
                        }
                        """.formatted(otherQuiz.getCohorts().getFirst().getGuid())
                    )
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Cohort does not belong to this quiz."));

        assertThat(attemptRepository.count()).isEqualTo(attemptsBefore);
    }

    @Test
    public void createAttemptPersistsTrimmedNickname() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace).question("Q1"));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        var result = mockMvc
            .perform(
                post("/api/quiz/{id}/attempts", quiz.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                            "nickname": "  Quiz Falcon  "
                        }
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.attemptId").isNumber())
            .andReturn();

        Integer attemptId = JsonPath.read(result.getResponse().getContentAsString(), "$.attemptId");
        var attempt = attemptRepository.findById(attemptId).orElseThrow();

        assertThat(attempt.getNickname()).isEqualTo("Quiz Falcon");
    }

    @Test
    public void recordTimeoutStampsServerSideTimestamp() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);

        var before = LocalDateTime.now();
        mockMvc
            .perform(post("/api/quiz/{id}/attempts/{attemptId}/timeout", quiz.getId(), attempt.getId()))
            .andExpect(status().isNoContent());

        var stored = attemptRepository.findById(attempt.getId()).orElseThrow();
        assertThat(stored.getTimedOutAt()).isNotNull();
        assertThat(stored.getTimedOutAt()).isAfterOrEqualTo(before);
        assertThat(stored.getFinishedAt()).isNull();
    }

    @Test
    public void recordTimeoutOnFinishedAttemptReturnsConflict() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());
        Attempt attempt = fixtures.save(fixtures.attempt(quiz), question);

        mockMvc
            .perform(post("/api/quiz/{id}/attempts/{attemptId}/timeout", quiz.getId(), attempt.getId()))
            .andExpect(status().isConflict());

        assertThat(attemptRepository.findById(attempt.getId()).orElseThrow().getTimedOutAt()).isNull();
    }

    @Test
    public void recordTimeoutOnAttemptForDifferentQuizReturnsNotFound() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());
        Quiz otherQuiz = fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());
        Attempt attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);

        mockMvc
            .perform(post("/api/quiz/{id}/attempts/{attemptId}/timeout", otherQuiz.getId(), attempt.getId()))
            .andExpect(status().isNotFound());
    }

    @Test
    public void recordTimeoutForUnknownAttemptReturnsNotFound() throws Exception {
        mockMvc.perform(post("/api/quiz/{id}/attempts/{attemptId}/timeout", -1, -1)).andExpect(status().isNotFound());
    }

    @Test
    public void evaluateQuizScoresFromPersistedAttemptQuestions() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Question q2 = fixtures.save(
            fixtures
                .questionIn(workspace)
                .question("Which are cities in Italy?")
                .answers(new String[] { "Naples", "Rome", "Paris", "Berlin" })
                .correctAnswers(new int[] { 0, 1 })
                .explanations(new String[] { "Yes", "Yes", "No", "No" })
                .questionType("multiple")
        );
        Quiz quiz = fixtures.save(
            fixtures.quiz(q1, q2).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        var attempt = fixtures.save(fixtures.attemptInProgress(quiz), q1, q2);
        fixtures.score(attempt, q1, AnswerStatus.CORRECT);
        fixtures.score(attempt, q2, AnswerStatus.PARTIAL);

        mockMvc
            .perform(post("/api/quiz/{id}/attempts/{attemptId}/evaluate", quiz.getId(), attempt.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.score").value(1.5))
            .andExpect(jsonPath("$.totalQuestions").value(2))
            .andExpect(jsonPath("$.questions.length()").value(2))
            .andExpect(jsonPath("$.questions[0].status").value("CORRECT"))
            .andExpect(jsonPath("$.questions[1].status").value("PARTIAL"))
            .andExpect(jsonPath("$.questions[0].question.correctAnswers[0]").value(1))
            .andExpect(jsonPath("$.questions[1].question.correctAnswers.length()").value(2))
            .andExpect(jsonPath("$.questions[0].question.workspaceGuid").doesNotExist());
    }

    @Test
    public void evaluateQuizRejectsFinishedAttempt() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures.quiz(question).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        var attempt = fixtures.save(fixtures.attempt(quiz), question);

        mockMvc
            .perform(post("/api/quiz/{id}/attempts/{attemptId}/evaluate", quiz.getId(), attempt.getId()))
            .andExpect(status().isConflict());
    }

    @Test
    public void submitAttemptQuestionReturnsEvaluationForLearnQuizQuestion() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(question)
                .workspaceGuid(workspace.getGuid())
                .mode(QuizMode.LEARN)
                .randomQuestionCount(null)
                .build()
        );
        var attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);

        mockMvc
            .perform(
                post(
                    "/api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit",
                    quiz.getId(),
                    attempt.getId(),
                    question.getId()
                )
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"type": "choice", "selectedIdxs": [1]}
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {"status": "CORRECT", "score": 1.0}
                    """
                )
            )
            .andExpect(jsonPath("$.correctAnswers").doesNotExist());
    }

    @Test
    public void submitAttemptQuestionInExamReturnsScoreWithoutLeakingFeedback() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(question)
                .workspaceGuid(workspace.getGuid())
                .mode(QuizMode.EXAM)
                .randomQuestionCount(null)
                .build()
        );
        var attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);

        mockMvc
            .perform(
                post(
                    "/api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit",
                    quiz.getId(),
                    attempt.getId(),
                    question.getId()
                )
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"type": "choice", "selectedIdxs": [1]}
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {"status": "CORRECT", "score": 1.0}
                    """
                )
            )
            .andExpect(jsonPath("$.question").doesNotExist());

        var score = attemptQuestionRepository
            .findByAttemptIdAndQuestionId(attempt.getId(), question.getId())
            .orElseThrow();
        assertThat(score.getStatus()).isEqualTo(AnswerStatus.CORRECT);
    }

    @Test
    public void submitAttemptQuestionInExamRetakeOverwritesPriorOutcome() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(question)
                .workspaceGuid(workspace.getGuid())
                .mode(QuizMode.EXAM)
                .randomQuestionCount(null)
                .build()
        );
        var attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);

        mockMvc
            .perform(
                post(
                    "/api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit",
                    quiz.getId(),
                    attempt.getId(),
                    question.getId()
                )
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"type": "choice", "selectedIdxs": [0]}
                        """
                    )
            )
            .andExpect(status().isOk());

        mockMvc
            .perform(
                post(
                    "/api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit",
                    quiz.getId(),
                    attempt.getId(),
                    question.getId()
                )
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"type": "choice", "selectedIdxs": [1]}
                        """
                    )
            )
            .andExpect(status().isOk());

        var score = attemptQuestionRepository
            .findByAttemptIdAndQuestionId(attempt.getId(), question.getId())
            .orElseThrow();
        assertThat(score.getStatus()).isEqualTo(AnswerStatus.CORRECT);
    }

    @Test
    public void submitAttemptQuestionInLearnRetakePreservesFirstOutcome() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(question)
                .workspaceGuid(workspace.getGuid())
                .mode(QuizMode.LEARN)
                .randomQuestionCount(null)
                .build()
        );
        var attempt = fixtures.save(fixtures.attemptInProgress(quiz), question);

        mockMvc
            .perform(
                post(
                    "/api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit",
                    quiz.getId(),
                    attempt.getId(),
                    question.getId()
                )
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"type": "choice", "selectedIdxs": [0]}
                        """
                    )
            )
            .andExpect(status().isOk());

        mockMvc
            .perform(
                post(
                    "/api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit",
                    quiz.getId(),
                    attempt.getId(),
                    question.getId()
                )
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"type": "choice", "selectedIdxs": [1]}
                        """
                    )
            )
            .andExpect(status().isOk());

        var score = attemptQuestionRepository
            .findByAttemptIdAndQuestionId(attempt.getId(), question.getId())
            .orElseThrow();
        assertThat(score.getStatus()).isEqualTo(AnswerStatus.INCORRECT);
    }
}
