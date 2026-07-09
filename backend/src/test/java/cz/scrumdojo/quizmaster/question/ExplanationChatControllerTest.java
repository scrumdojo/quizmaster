package cz.scrumdojo.quizmaster.question;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import cz.scrumdojo.quizmaster.TestFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
public class ExplanationChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void chatOnUnknownQuestionReturnsNotFound() throws Exception {
        mockMvc
            .perform(
                post("/api/question/{id}/explanation-chat", 999_999)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                            {"messages": [{"role": "user", "content": "Explain this?"}]}
                        """
                    )
            )
            .andExpect(status().isNotFound());
    }

    @Test
    public void chatWithoutMessagesReturnsBadRequestWithCode() throws Exception {
        Question question = fixtures.save(fixtures.question());

        mockMvc
            .perform(
                post("/api/question/{id}/explanation-chat", question.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                            {"messages": []}
                        """
                    )
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("empty-chat-messages"));
    }

    @Test
    public void chatEndingWithAssistantTurnReturnsBadRequestWithCode() throws Exception {
        Question question = fixtures.save(fixtures.question());

        mockMvc
            .perform(
                post("/api/question/{id}/explanation-chat", question.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                            {
                                "messages": [
                                    {"role": "user", "content": "Explain this?"},
                                    {"role": "assistant", "content": "Sure."},
                                    {"role": "assistant", "content": ""}
                                ]
                            }
                        """
                    )
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("invalid-last-message"));
    }
}
