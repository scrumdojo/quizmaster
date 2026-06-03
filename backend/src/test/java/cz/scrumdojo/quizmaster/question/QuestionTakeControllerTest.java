package cz.scrumdojo.quizmaster.question;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
public class QuestionTakeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void getQuestion() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));

        mockMvc
            .perform(get("/api/question/{id}", question.getId()))
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {
                        "question": "What is the capital of Italy?",
                        "answers": ["Naples", "Rome", "Florence", "Palermo"],
                        "correctAnswerCount": 1,
                        "isEasy": false
                    }
                    """
                )
            )
            .andExpect(jsonPath("$.correctAnswers").doesNotExist())
            .andExpect(jsonPath("$.explanations").doesNotExist())
            .andExpect(jsonPath("$.questionExplanation").doesNotExist())
            .andExpect(jsonPath("$.workspaceGuid").doesNotExist())
            .andExpect(jsonPath("$.tolerance").doesNotExist());
    }

    @Test
    public void getNumericalQuestionDoesNotExposeCorrectAnswerOrTolerance() throws Exception {
        Question question = fixtures.save(
            fixtures
                .question()
                .question("What is pi rounded to two decimals?")
                .answers(new String[] { "3.14" })
                .correctAnswers(new int[] { 0 })
                .questionType(QuestionType.NUMERICAL)
                .tolerance(0.01)
        );

        mockMvc
            .perform(get("/api/question/{id}", question.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.answers").isEmpty())
            .andExpect(content().string(not(containsString("3.14"))))
            .andExpect(jsonPath("$.tolerance").doesNotExist())
            .andExpect(jsonPath("$.correctAnswers").doesNotExist());
    }

    @Test
    public void submitQuestionReturnsEvaluationOnly() throws Exception {
        Question question = fixtures.save(fixtures.question());

        mockMvc
            .perform(
                post("/api/question/{id}/submit", question.getId())
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
            .andExpect(jsonPath("$.correctAnswers").doesNotExist())
            .andExpect(jsonPath("$.question.correctAnswers[0]").value(1))
            .andExpect(jsonPath("$.question.explanations").isArray())
            .andExpect(jsonPath("$.question.workspaceGuid").doesNotExist());
    }

    @Test
    public void submitQuestionDeduplicatesSelectedAnswers() throws Exception {
        Question question = fixtures.save(fixtures.multipleChoiceQuestion());

        mockMvc
            .perform(
                post("/api/question/{id}/submit", question.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"type": "choice", "selectedIdxs": [0, 0]}
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {"status": "PARTIAL", "score": 0.5}
                    """
                )
            );
    }

    @Test
    public void submitNumericalQuestionWithinToleranceIsCorrect() throws Exception {
        Question question = fixtures.save(
            fixtures
                .question()
                .question("What is pi rounded to two decimals?")
                .answers(new String[] { "3.14" })
                .correctAnswers(new int[] { 0 })
                .questionType(QuestionType.NUMERICAL)
                .tolerance(0.01)
        );

        mockMvc
            .perform(
                post("/api/question/{id}/submit", question.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"type": "numerical", "value": 3.13}
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {
                        "status": "CORRECT",
                        "score": 1.0,
                        "question": {
                            "questionType": "numerical",
                            "answers": ["3.14"],
                            "correctAnswers": [0],
                            "tolerance": 0.01
                        }
                    }
                    """
                )
            )
            .andExpect(jsonPath("$.question.workspaceGuid").doesNotExist());
    }

    @Test
    public void submitNumericalQuestionOutsideToleranceIsIncorrect() throws Exception {
        Question question = fixtures.save(
            fixtures
                .question()
                .question("What is pi rounded to two decimals?")
                .answers(new String[] { "3.14" })
                .correctAnswers(new int[] { 0 })
                .questionType(QuestionType.NUMERICAL)
                .tolerance(0.01)
        );

        mockMvc
            .perform(
                post("/api/question/{id}/submit", question.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"type": "numerical", "value": 3.16}
                        """
                    )
            )
            .andExpect(status().isOk())
            .andExpect(
                content().json(
                    """
                    {"status": "INCORRECT", "score": 0.0}
                    """
                )
            );
    }

    @Test
    public void submitQuestionInQuizReturnsForbidden() throws Exception {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.questionIn(workspace));
        fixtures.save(fixtures.quiz(question).workspaceGuid(workspace.getGuid()).build());

        mockMvc
            .perform(
                post("/api/question/{id}/submit", question.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"type": "choice", "selectedIdxs": [1]}
                        """
                    )
            )
            .andExpect(status().isForbidden());
    }

    @Test
    public void nonExistingQuestionReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/question/{id}", -1)).andExpect(status().isNotFound());
    }
}
