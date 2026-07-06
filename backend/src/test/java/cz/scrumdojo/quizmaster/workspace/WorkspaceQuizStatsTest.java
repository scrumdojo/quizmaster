package cz.scrumdojo.quizmaster.workspace;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.attempt.AnswerStatus;
import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
public class WorkspaceQuizStatsTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void emptyStatsForQuizWithNoAttempts() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Question q2 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures.quiz(q1, q2).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                        {
                            "summary": { "started": 0, "finished": 0, "unfinished": 0, "timeout": 0 },
                            "attempts": []
                        }
                    """
                )
            );
    }

    @Test
    public void derivesSummaryAndAttemptFields() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Question q2 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures.quiz(q1, q2).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        Attempt attempt = fixtures.save(fixtures.attempt(quiz), q1, q2);
        fixtures.score(attempt, q1, AnswerStatus.CORRECT, LocalDateTime.now());
        fixtures.score(attempt, q2, AnswerStatus.INCORRECT, LocalDateTime.now());
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {
                        "attempts": [
                            {
                                "totalQuestions": 2,
                                "correctAnswers": 1,
                                "incorrectAnswers": 1,
                                "score": 50
                            }
                        ],
                        "summary": { "started": 1, "finished": 1 }
                    }
                    """
                )
            );
    }

    @Test
    public void finishedAttemptHasStatusFinished() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures.quiz(q1).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        Attempt attempt = fixtures.save(fixtures.attempt(quiz), q1);
        fixtures.score(attempt, q1, AnswerStatus.CORRECT, LocalDateTime.now());
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {"attempts": [{"status": "FINISHED"}]}
                    """
                )
            )
            .andExpect(jsonPath("$.attempts[0].durationSeconds").isNumber());
    }

    @Test
    public void timedOutAttemptHasStatusTimeout() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures.quiz(q1).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        fixtures.save(fixtures.attemptTimedOut(quiz));
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {
                        "attempts": [{"status": "TIMEOUT"}],
                        "summary": {"timeout": 1}
                    }
                    """
                )
            );
    }

    @Test
    public void inProgressAttemptHasStatusInProgress() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures.quiz(q1).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        fixtures.save(fixtures.attemptInProgress(quiz));
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {
                        "attempts": [{"status": "IN_PROGRESS"}],
                        "summary": {"unfinished": 1}
                    }
                    """
                )
            )
            .andExpect(jsonPath("$.attempts[0].durationSeconds").isEmpty());
    }

    @Test
    public void abandonedAttemptHasStatusAbandoned() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures.quiz(q1).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        fixtures.save(fixtures.attemptAbandoned(quiz));
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {
                        "attempts": [{"status": "ABANDONED"}],
                        "summary": {"unfinished": 1}
                    }
                    """
                )
            );
    }

    @Test
    public void dryRunAttemptsAreExcludedFromStats() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures.quiz(q1).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        Attempt realAttempt = fixtures.save(fixtures.attempt(quiz), q1);
        fixtures.score(realAttempt, q1, AnswerStatus.CORRECT, LocalDateTime.now());
        Attempt dryRunAttempt = fixtures.save(fixtures.attempt(quiz).isDryRun(true), q1);
        fixtures.score(dryRunAttempt, q1, AnswerStatus.INCORRECT, LocalDateTime.now());
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                        {
                            "summary": { "started": 1, "finished": 1 },
                            "attempts": [{ "correctAnswers": 1 }]
                        }
                    """
                )
            )
            .andExpect(jsonPath("$.attempts.length()").value(1));
    }

    @Test
    public void questionStatisticsAreSeparatedForEachQuiz() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question shared = fixtures.save(fixtures.questionIn(workspace).question("Which are planets in solar system?"));
        Question skipped = fixtures.save(fixtures.questionIn(workspace).question("What is the capital of Italy?"));
        Question timeout = fixtures.save(fixtures.questionIn(workspace).question("What color is the sky?"));
        Question correct = fixtures.save(fixtures.questionIn(workspace).question("What is 2 + 2?"));
        Quiz firstQuiz = fixtures.save(
            fixtures.quiz(shared, skipped, timeout).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        Quiz secondQuiz = fixtures.save(
            fixtures.quiz(shared, correct).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        LocalDateTime now = LocalDateTime.now();
        Attempt firstQuizTimeoutAttempt = fixtures.save(
            fixtures
                .attempt(firstQuiz)
                .startedAt(now.minusSeconds(10))
                .finishedAt(now.minusSeconds(5))
                .timedOutAt(now.minusSeconds(5)),
            shared,
            skipped,
            timeout
        );
        fixtures.score(firstQuizTimeoutAttempt, shared, AnswerStatus.PARTIAL, now.minusSeconds(8));
        Attempt firstQuizAbandonedAttempt = fixtures.save(
            fixtures.attemptAbandoned(firstQuiz).startedAt(now.minusSeconds(4)).timedOutAt(now.minusSeconds(1)),
            shared,
            skipped,
            timeout
        );
        fixtures.score(firstQuizAbandonedAttempt, shared, AnswerStatus.CORRECT, now.minusSeconds(3));
        Attempt secondQuizFinishedAttempt = fixtures.save(
            fixtures.attempt(secondQuiz).startedAt(now.minusSeconds(20)).finishedAt(now.minusSeconds(12)),
            shared,
            correct
        );
        fixtures.score(secondQuizFinishedAttempt, shared, AnswerStatus.INCORRECT, now.minusSeconds(18));
        fixtures.score(secondQuizFinishedAttempt, correct, AnswerStatus.CORRECT, now.minusSeconds(14));
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), firstQuiz.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                        {
                          "questionStatistics": [
                            {
                              "question": "Which are planets in solar system?",
                              "answered": 2,
                              "correctAnswers": 1,
                              "partiallyCorrectAnswers": 1,
                              "incorrectAnswers": 0,
                              "unanswered": 0
                            },
                            {
                              "question": "What is the capital of Italy?",
                              "answered": 0,
                              "correctAnswers": 0,
                              "partiallyCorrectAnswers": 0,
                              "incorrectAnswers": 0,
                              "unanswered": 2
                            },
                            {
                              "question": "What color is the sky?",
                              "answered": 0,
                              "correctAnswers": 0,
                              "partiallyCorrectAnswers": 0,
                              "incorrectAnswers": 0,
                              "unanswered": 2
                            }
                          ]
                        }
                    """
                )
            );
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), secondQuiz.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                        {
                          "questionStatistics": [
                            {
                              "question": "Which are planets in solar system?",
                              "answered": 1,
                              "correctAnswers": 0,
                              "partiallyCorrectAnswers": 0,
                              "incorrectAnswers": 1,
                              "unanswered": 0
                            },
                            {
                              "question": "What is 2 + 2?",
                              "answered": 1,
                              "correctAnswers": 1,
                              "partiallyCorrectAnswers": 0,
                              "incorrectAnswers": 0,
                              "unanswered": 0
                            }
                          ]
                        }
                    """
                )
            );
    }

    @Test
    public void tagStatisticsAggregateAnswersPerTagWeakestFirst() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question sprint = fixtures.save(
            fixtures.questionIn(workspace).question("What is a Sprint?").tags(new String[] { "scrum", "timeboxes" })
        );
        Question daily = fixtures.save(
            fixtures.questionIn(workspace).question("What is a Daily Scrum?").tags(new String[] { "timeboxes" })
        );
        Quiz quiz = fixtures.save(
            fixtures.quiz(sprint, daily).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        Attempt attempt = fixtures.save(fixtures.attempt(quiz), sprint, daily);
        fixtures.score(attempt, sprint, AnswerStatus.CORRECT, LocalDateTime.now());
        fixtures.score(attempt, daily, AnswerStatus.INCORRECT, LocalDateTime.now());
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tagStatistics[0].tag").value("timeboxes"))
            .andExpect(jsonPath("$.tagStatistics[1].tag").value("scrum"))
            .andExpect(
                content().json(
                    """
                        {
                          "tagStatistics": [
                            {
                              "tag": "timeboxes",
                              "questions": 2,
                              "answered": 2,
                              "correctAnswers": 1,
                              "partiallyCorrectAnswers": 0,
                              "incorrectAnswers": 1,
                              "unanswered": 0
                            },
                            {
                              "tag": "scrum",
                              "questions": 1,
                              "answered": 1,
                              "correctAnswers": 1,
                              "partiallyCorrectAnswers": 0,
                              "incorrectAnswers": 0,
                              "unanswered": 0
                            }
                          ]
                        }
                    """
                )
            );
    }

    @Test
    public void untaggedQuestionsGatherInUntaggedRowSortedLast() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question tagged = fixtures.save(
            fixtures.questionIn(workspace).question("What is a Sprint?").tags(new String[] { "scrum" })
        );
        Question untagged = fixtures.save(fixtures.questionIn(workspace).question("What is a Backlog?"));
        Quiz quiz = fixtures.save(
            fixtures.quiz(tagged, untagged).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        Attempt attempt = fixtures.save(fixtures.attempt(quiz), tagged, untagged);
        fixtures.score(attempt, tagged, AnswerStatus.CORRECT, LocalDateTime.now());
        fixtures.score(attempt, untagged, AnswerStatus.INCORRECT, LocalDateTime.now());
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tagStatistics[0].tag").value("scrum"))
            .andExpect(jsonPath("$.tagStatistics[1].tag").value("Untagged"))
            .andExpect(jsonPath("$.tagStatistics[1].questions").value(1))
            .andExpect(jsonPath("$.tagStatistics[1].incorrectAnswers").value(1));
    }

    @Test
    public void noTagStatisticsWhenNoQuestionHasTags() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.questionIn(workspace));
        Quiz quiz = fixtures.save(
            fixtures.quiz(q1).workspaceGuid(workspace.getGuid()).randomQuestionCount(null).build()
        );
        Attempt attempt = fixtures.save(fixtures.attempt(quiz), q1);
        fixtures.score(attempt, q1, AnswerStatus.CORRECT, LocalDateTime.now());
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), quiz.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tagStatistics.length()").value(0));
    }

    @Test
    public void nonExistentQuizReturns404() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", workspace.getGuid(), -1))
            .andExpect(status().isNotFound());
    }

    @Test
    public void missingWorkspaceReturns404() throws Exception {
        mockMvc
            .perform(get("/api/workspaces/{guid}/quizzes/{id}/stats", "non-existent-guid", -1))
            .andExpect(status().isNotFound());
    }
}
