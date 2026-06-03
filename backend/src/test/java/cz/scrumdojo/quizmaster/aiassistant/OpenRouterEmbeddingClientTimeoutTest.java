package cz.scrumdojo.quizmaster.aiassistant;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = "ai.embedding.timeout=PT5S")
class OpenRouterEmbeddingClientTimeoutTest {

    @Autowired
    private OpenRouterEmbeddingClient embeddingClient;

    @Test
    void usesConfiguredTimeoutProperty() {
        assertThat(embeddingClient.timeout()).isEqualTo(Duration.ofSeconds(5));
    }
}
