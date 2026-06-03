package cz.scrumdojo.quizmaster.aiassistant;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OpenRouterEmbeddingClient {

    private static final String OPENROUTER_EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiToken;
    private final String model;
    private final Duration timeout;

    public OpenRouterEmbeddingClient(
        ObjectMapper objectMapper,
        @Value("${ai.token:}") String apiToken,
        @Value("${ai.embedding.model}") String model,
        @Value("${ai.embedding.timeout:PT10S}") Duration timeout
    ) {
        this.objectMapper = objectMapper;
        this.apiToken = apiToken.strip();
        this.model = model;
        this.timeout = timeout;
        this.httpClient = HttpClient.newBuilder().connectTimeout(timeout).build();
    }

    public List<double[]> embed(List<String> inputs) {
        if (inputs == null || inputs.isEmpty()) {
            return List.of();
        }
        if (apiToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI token is not configured.");
        }

        try {
            String body = objectMapper.writeValueAsString(new EmbeddingRequest(model, inputs));
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OPENROUTER_EMBEDDINGS_URL))
                .timeout(timeout)
                .header("Authorization", "Bearer " + apiToken)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Embedding request failed.");
            }

            JsonNode data = objectMapper.readTree(response.body()).path("data");
            if (!data.isArray() || data.size() != inputs.size()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Embedding response shape is invalid.");
            }

            List<double[]> embeddings = new ArrayList<>();
            for (JsonNode item : data) {
                JsonNode embedding = item.path("embedding");
                if (!embedding.isArray() || embedding.isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Embedding response shape is invalid.");
                }
                double[] values = new double[embedding.size()];
                for (int index = 0; index < embedding.size(); index++) {
                    values[index] = embedding.get(index).asDouble();
                }
                embeddings.add(values);
            }
            return embeddings;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Embedding request failed.");
        }
    }

    Duration timeout() {
        return timeout;
    }

    private record EmbeddingRequest(String model, @JsonProperty("input") List<String> input) {}
}
