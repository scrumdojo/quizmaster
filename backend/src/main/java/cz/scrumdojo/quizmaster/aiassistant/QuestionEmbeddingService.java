package cz.scrumdojo.quizmaster.aiassistant;

import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import java.util.List;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Service
public class QuestionEmbeddingService {

    private final OpenRouterEmbeddingClient embeddingClient;
    private final QuestionRepository questionRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final String embeddingModel;

    public QuestionEmbeddingService(
        OpenRouterEmbeddingClient embeddingClient,
        QuestionRepository questionRepository,
        ApplicationEventPublisher eventPublisher,
        @Value("${ai.embedding.model}") String embeddingModel
    ) {
        this.embeddingClient = embeddingClient;
        this.questionRepository = questionRepository;
        this.eventPublisher = eventPublisher;
        this.embeddingModel = embeddingModel;
    }

    public void embedForSave(Question question) {
        if (question == null || !QuestionEmbeddingText.shouldEmbed(question.getQuestion())) {
            clearEmbedding(question);
            return;
        }

        double[] embedding = embedQuestionText(question.getQuestion());
        question.setEmbedding(embedding);
        question.setEmbeddingModel(embeddingModel);
        question.setEmbeddingTextHash(QuestionEmbeddingText.hash(question.getQuestion()));
    }

    public void scheduleEmbedding(Integer questionId) {
        if (questionId == null) {
            return;
        }
        eventPublisher.publishEvent(new QuestionEmbeddingRequestedEvent(questionId));
    }

    @Async("backgroundTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleQuestionEmbeddingRequested(QuestionEmbeddingRequestedEvent event) {
        questionRepository.findById(event.questionId()).ifPresent(this::embedBestEffort);
    }

    private void embedBestEffort(Question question) {
        try {
            embedForSave(question);
            questionRepository.save(question);
        } catch (RuntimeException e) {
            var id = question == null ? null : question.getId();
            var workspaceGuid = question == null ? null : question.getWorkspaceGuid();
            log.warn(
                "Embedding failed for question {} in workspace {}, saving without embedding",
                id,
                workspaceGuid,
                e
            );
            clearEmbedding(question);
            questionRepository.save(question);
        }
    }

    public static record QuestionEmbeddingRequestedEvent(Integer questionId) {}

    public double[] embedQuestionText(String questionText) {
        return embedQuestionTexts(List.of(questionText)).getFirst();
    }

    public List<double[]> embedQuestionTexts(List<String> questionTexts) {
        if (questionTexts == null || questionTexts.isEmpty()) {
            return List.of();
        }
        List<String> normalizedTexts = questionTexts.stream().map(QuestionEmbeddingText::normalize).toList();
        if (normalizedTexts.stream().anyMatch(String::isBlank)) {
            throw new IllegalArgumentException("Question text must not be blank for embedding.");
        }
        return embeddingClient.embed(normalizedTexts);
    }

    public boolean hasUsableEmbedding(Question question) {
        if (question == null || question.getEmbedding() == null || question.getEmbedding().length == 0) {
            return false;
        }
        if (!Objects.equals(question.getEmbeddingModel(), embeddingModel)) {
            return false;
        }
        return Objects.equals(question.getEmbeddingTextHash(), QuestionEmbeddingText.hash(question.getQuestion()));
    }

    public List<String> workspaceQuestionTexts(String workspaceGuid, Integer excludedQuestionId) {
        if (workspaceGuid == null || workspaceGuid.isBlank()) {
            return List.of();
        }
        return questionRepository
            .findByWorkspaceGuidOrderByIdDesc(workspaceGuid.strip())
            .stream()
            .filter(question -> excludedQuestionId == null || !excludedQuestionId.equals(question.getId()))
            .map(Question::getQuestion)
            .toList();
    }

    public List<UsableQuestionEmbedding> usableWorkspaceEmbeddings(String workspaceGuid, Integer excludedQuestionId) {
        if (workspaceGuid == null || workspaceGuid.isBlank()) {
            return List.of();
        }

        return questionRepository
            .findByWorkspaceGuidOrderByIdDesc(workspaceGuid.strip())
            .stream()
            .filter(question -> excludedQuestionId == null || !excludedQuestionId.equals(question.getId()))
            .filter(this::hasUsableEmbedding)
            .map(question ->
                new UsableQuestionEmbedding(question.getId(), question.getQuestion(), question.getEmbedding())
            )
            .toList();
    }

    private static void clearEmbedding(Question question) {
        if (question == null) {
            return;
        }
        question.setEmbedding(null);
        question.setEmbeddingModel(null);
        question.setEmbeddingTextHash(null);
    }

    public record UsableQuestionEmbedding(Integer questionId, String questionText, double[] embedding) {}
}
