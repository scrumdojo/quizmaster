package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.aiassistant.QuestionEmbeddingService;
import cz.scrumdojo.quizmaster.common.IdResponse;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.question.QuestionRequest;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspaces/{workspaceGuid}/questions")
public class WorkspaceQuestionController {

    private final WorkspaceGuard workspaceGuard;
    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final QuestionEmbeddingService questionEmbeddingService;

    public WorkspaceQuestionController(
        WorkspaceGuard workspaceGuard,
        QuestionRepository questionRepository,
        QuizRepository quizRepository,
        QuestionEmbeddingService questionEmbeddingService
    ) {
        this.workspaceGuard = workspaceGuard;
        this.questionRepository = questionRepository;
        this.quizRepository = quizRepository;
        this.questionEmbeddingService = questionEmbeddingService;
    }

    private static final int PAGE_SIZE = 10;

    /**
     * Request header that lets a caller create or update a question without computing its embedding.
     *
     * <p>Embeddings exist solely to feed Robin's AI duplicate detection. A question write schedules one
     * via a background OpenRouter call after the transaction commits. Our E2E suite creates many questions
     * per scenario as plain setup (no AI involved), and with a real API key in CI every one of those writes
     * would fire a billable embedding call for nothing. This header lets non-{@code @ai} scenarios opt out
     * of scheduling embeddings so the suite spends no OpenRouter tokens on setup; production callers never
     * send it, so the default behaviour (embed) is unchanged.
     */
    static final String SKIP_EMBEDDING_HEADER = "X-Skip-Embedding";

    @Transactional(readOnly = true)
    @GetMapping
    public ResponseEntity<QuestionPageResponse> getWorkspaceQuestions(
        @PathVariable String workspaceGuid,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(required = false) String query,
        @RequestParam(name = "tag", required = false) List<String> tags
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        String normalizedQuery = query == null ? "" : query.trim();
        String[] normalizedTags =
            tags == null
                ? new String[0]
                : tags
                      .stream()
                      .map(String::trim)
                      .filter(tag -> !tag.isEmpty())
                      .map(String::toLowerCase)
                      .distinct()
                      .toArray(String[]::new);

        var pageRequest = PageRequest.of(page, PAGE_SIZE);
        var questionPage = normalizedQuery.isEmpty()
            ? (normalizedTags.length == 0
                  ? questionRepository.findByWorkspaceGuidOrderByIdDesc(workspaceGuid, pageRequest)
                  : questionRepository.findByWorkspaceGuidAndAnySelectedTag(workspaceGuid, normalizedTags, pageRequest))
            : (normalizedTags.length == 0
                  ? questionRepository.searchByWorkspaceGuidAndQuestionOrTagContainingIgnoreCase(
                        workspaceGuid,
                        normalizedQuery,
                        pageRequest
                    )
                  : questionRepository.searchByWorkspaceGuidAndQuestionOrTagContainingIgnoreCaseAndAnySelectedTag(
                        workspaceGuid,
                        normalizedQuery,
                        normalizedTags,
                        pageRequest
                    ));
        List<String> availableTags = questionRepository.findDistinctTagsByWorkspaceGuid(workspaceGuid);
        var items = questionPage
            .getContent()
            .stream()
            .map(q ->
                QuestionListItem.from(
                    q,
                    quizRepository.findQuizTitlesByWorkspaceGuidAndQuestionId(workspaceGuid, q.getId())
                )
            )
            .toList();

        return ResponseEntity.ok(
            new QuestionPageResponse(
                items,
                availableTags,
                questionPage.getTotalPages(),
                questionPage.getTotalElements(),
                questionPage.getSize(),
                questionPage.getNumber()
            )
        );
    }

    @Transactional(readOnly = true)
    @GetMapping("/{id}")
    public ResponseEntity<QuestionResponse> getWorkspaceQuestion(
        @PathVariable String workspaceGuid,
        @PathVariable Integer id
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        return ResponseHelper.okOrNotFound(
            questionRepository.findByIdAndWorkspaceGuid(id, workspaceGuid).map(QuestionResponse::from)
        );
    }

    @Transactional
    @PostMapping
    public ResponseEntity<IdResponse> createWorkspaceQuestion(
        @PathVariable String workspaceGuid,
        @Valid @RequestBody QuestionRequest request,
        @RequestHeader(value = SKIP_EMBEDDING_HEADER, defaultValue = "false") boolean skipEmbedding
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        var question = request.toEntity(workspaceGuid);
        var created = questionRepository.save(question);
        if (!skipEmbedding) {
            questionEmbeddingService.scheduleEmbedding(created.getId());
        }
        return ResponseEntity.ok(new IdResponse(created.getId()));
    }

    @Transactional
    @PatchMapping("/{id}")
    public ResponseEntity<IdResponse> updateWorkspaceQuestion(
        @PathVariable String workspaceGuid,
        @PathVariable Integer id,
        @Valid @RequestBody QuestionRequest request,
        @RequestHeader(value = SKIP_EMBEDDING_HEADER, defaultValue = "false") boolean skipEmbedding
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        return questionRepository
            .findByIdAndWorkspaceGuid(id, workspaceGuid)
            .map(existing -> {
                var question = request.toEntity(workspaceGuid);
                question.setId(existing.getId());
                questionRepository.save(question);
                if (!skipEmbedding) {
                    questionEmbeddingService.scheduleEmbedding(existing.getId());
                }
                return ResponseEntity.ok(new IdResponse(existing.getId()));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkspaceQuestion(@PathVariable String workspaceGuid, @PathVariable Integer id) {
        workspaceGuard.requireExists(workspaceGuid);

        int deleted = questionRepository.deleteByIdAndWorkspaceGuid(id, workspaceGuid);
        return deleted > 0 ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
