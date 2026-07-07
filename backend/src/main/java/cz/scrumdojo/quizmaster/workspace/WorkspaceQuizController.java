package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.attempt.AttemptService;
import cz.scrumdojo.quizmaster.common.CodedResponseStatusException;
import cz.scrumdojo.quizmaster.common.IdResponse;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.quiz.Cohort;
import cz.scrumdojo.quizmaster.quiz.CohortRepository;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizAttemptStartResponse;
import cz.scrumdojo.quizmaster.quiz.QuizCohortResponse;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import cz.scrumdojo.quizmaster.quiz.QuizRequest;
import cz.scrumdojo.quizmaster.quiz.QuizResponse;
import cz.scrumdojo.quizmaster.quiz.QuizService;
import cz.scrumdojo.quizmaster.quiz.livestats.QuizLiveStatsResponse;
import cz.scrumdojo.quizmaster.quiz.livestats.QuizLiveStatsService;
import cz.scrumdojo.quizmaster.quiz.stats.QuizStatsResponse;
import cz.scrumdojo.quizmaster.quiz.stats.QuizStatsService;
import jakarta.validation.Valid;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/workspaces/{workspaceGuid}/quizzes")
public class WorkspaceQuizController {

    private final WorkspaceGuard workspaceGuard;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizService quizService;
    private final QuizStatsService quizStatsService;
    private final QuizLiveStatsService quizLiveStatsService;
    private final AttemptService attemptService;
    private final CohortRepository cohortRepository;
    private final Clock clock;

    public WorkspaceQuizController(
        WorkspaceGuard workspaceGuard,
        QuizRepository quizRepository,
        QuestionRepository questionRepository,
        QuizService quizService,
        QuizStatsService quizStatsService,
        QuizLiveStatsService quizLiveStatsService,
        AttemptService attemptService,
        CohortRepository cohortRepository,
        Clock clock
    ) {
        this.workspaceGuard = workspaceGuard;
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.quizService = quizService;
        this.quizStatsService = quizStatsService;
        this.quizLiveStatsService = quizLiveStatsService;
        this.attemptService = attemptService;
        this.cohortRepository = cohortRepository;
        this.clock = clock;
    }

    private static final int PAGE_SIZE = 10;

    @Transactional(readOnly = true)
    @GetMapping
    public ResponseEntity<QuizPageResponse> getWorkspaceQuizzes(
        @PathVariable String workspaceGuid,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(required = false) String query
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        String normalizedQuery = query == null ? "" : query.trim();
        var quizPage = normalizedQuery.isEmpty()
            ? quizRepository.findByWorkspaceGuidOrderByIdDesc(workspaceGuid, PageRequest.of(page, PAGE_SIZE))
            : quizRepository.findByWorkspaceGuidAndTitleContainingIgnoreCaseOrderByIdDesc(
                  workspaceGuid,
                  normalizedQuery,
                  PageRequest.of(page, PAGE_SIZE)
              );

        var items = quizPage
            .getContent()
            .stream()
            .map(quiz -> new QuizListItem(quiz.getId(), quiz.getTitle()))
            .toList();

        return ResponseEntity.ok(
            new QuizPageResponse(items, quizPage.getTotalPages(), quizPage.getSize(), quizPage.getNumber())
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizResponse> getQuiz(@PathVariable String workspaceGuid, @PathVariable Integer id) {
        workspaceGuard.requireExists(workspaceGuid);

        return ResponseHelper.okOrNotFound(quizService.getWorkspaceQuiz(workspaceGuid, id));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<QuizStatsResponse> getQuizStats(
        @PathVariable String workspaceGuid,
        @PathVariable Integer id
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        return ResponseHelper.okOrNotFound(quizStatsService.getStats(workspaceGuid, id));
    }

    @GetMapping("/{id}/live-stats")
    public ResponseEntity<QuizLiveStatsResponse> getQuizLiveStats(
        @PathVariable String workspaceGuid,
        @PathVariable Integer id
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        return ResponseHelper.okOrNotFound(quizLiveStatsService.getLiveStats(workspaceGuid, id));
    }

    @Transactional
    @PostMapping
    public ResponseEntity<IdResponse> createQuiz(
        @PathVariable String workspaceGuid,
        @Valid @RequestBody QuizRequest request
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        validateQuestionsBelongToWorkspace(request.questionIds(), workspaceGuid);
        validateQuestionWeights(request.questionWeights());

        Quiz output = quizRepository.save(request.toEntity(workspaceGuid));
        return ResponseEntity.ok(new IdResponse(output.getId()));
    }

    @Transactional
    @PutMapping("/{id}")
    public ResponseEntity<IdResponse> updateQuiz(
        @PathVariable String workspaceGuid,
        @PathVariable Integer id,
        @Valid @RequestBody QuizRequest request
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        return quizRepository
            .findByIdAndWorkspaceGuid(id, workspaceGuid)
            .map(existing -> {
                validateQuestionsBelongToWorkspace(request.questionIds(), workspaceGuid);
                validateQuestionWeights(request.questionWeights());
                Quiz incoming = request.toEntity(workspaceGuid);
                existing.setTitle(incoming.getTitle());
                existing.setDescription(incoming.getDescription());
                existing.setStartAt(incoming.getStartAt());
                existing.setEndAt(incoming.getEndAt());
                existing.setQuestionIds(incoming.getQuestionIds());
                existing.setQuestionWeights(incoming.getQuestionWeights());
                existing.setMode(incoming.getMode());
                existing.setDifficulty(incoming.getDifficulty());
                existing.setPassScore(incoming.getPassScore());
                existing.setTimeLimit(incoming.getTimeLimit());
                existing.setRandomQuestionCount(incoming.getRandomQuestionCount());
                quizRepository.save(existing);
                return ResponseEntity.ok(new IdResponse(existing.getId()));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @PostMapping("/{id}/cohorts")
    public ResponseEntity<?> createCohort(
        @PathVariable String workspaceGuid,
        @PathVariable Integer id,
        @RequestBody CohortCreateRequest request
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        Quiz quiz = quizRepository
            .findByIdAndWorkspaceGuid(id, workspaceGuid)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        String name = request == null ? null : request.name();
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "empty-cohort-name"));
        }
        boolean duplicate = cohortRepository
            .findByQuizIdOrderByName(quiz.getId())
            .stream()
            .anyMatch(c -> c.getName().equals(name));
        if (duplicate) {
            return ResponseEntity.badRequest().body(Map.of("error", "duplicate-cohort-name"));
        }

        Cohort saved = cohortRepository.save(Cohort.builder().name(name).quiz(quiz).build());
        return ResponseEntity.ok(QuizCohortResponse.from(saved, quizService.canDelete(saved)));
    }

    @Transactional
    @PutMapping("/{id}/cohorts/{cohortGuid}")
    public ResponseEntity<?> updateCohort(
        @PathVariable String workspaceGuid,
        @PathVariable Integer id,
        @PathVariable String cohortGuid,
        @RequestBody CohortCreateRequest request
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        Quiz quiz = quizRepository
            .findByIdAndWorkspaceGuid(id, workspaceGuid)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Cohort cohort = cohortRepository
            .findByGuidAndQuizId(cohortGuid, quiz.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        String name = request == null ? null : request.name();
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "empty-cohort-name"));
        }
        boolean duplicate = cohortRepository
            .findByQuizIdOrderByName(quiz.getId())
            .stream()
            .anyMatch(c -> !c.getGuid().equals(cohortGuid) && c.getName().equals(name));
        if (duplicate) {
            return ResponseEntity.badRequest().body(Map.of("error", "duplicate-cohort-name"));
        }

        cohort.setName(name);
        Cohort saved = cohortRepository.save(cohort);
        return ResponseEntity.ok(QuizCohortResponse.from(saved, quizService.canDelete(saved)));
    }

    @Transactional
    @DeleteMapping("/{id}/cohorts/{cohortGuid}")
    public ResponseEntity<?> deleteCohort(
        @PathVariable String workspaceGuid,
        @PathVariable Integer id,
        @PathVariable String cohortGuid
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        Quiz quiz = quizRepository
            .findByIdAndWorkspaceGuid(id, workspaceGuid)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Cohort cohort = cohortRepository
            .findByGuidAndQuizId(cohortGuid, quiz.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!quizService.canDelete(cohort)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "cohort-has-attempts"));
        }

        cohortRepository.delete(cohort);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/dry-runs")
    public ResponseEntity<QuizAttemptStartResponse> createDryRun(
        @PathVariable String workspaceGuid,
        @PathVariable Integer id
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        return quizRepository
            .findByIdAndWorkspaceGuid(id, workspaceGuid)
            .map(quiz ->
                ResponseEntity.ok(
                    QuizAttemptStartResponse.from(
                        attemptService.start(quiz, null, null, true, LocalDateTime.now(clock))
                    )
                )
            )
            .orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable String workspaceGuid, @PathVariable Integer id) {
        workspaceGuard.requireExists(workspaceGuid);

        int deleted = quizRepository.deleteByIdAndWorkspaceGuid(id, workspaceGuid);
        return deleted > 0 ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    private void validateQuestionWeights(int[] questionWeights) {
        if (questionWeights == null) return;
        for (int w : questionWeights) {
            if (w < 1 || w > 5) {
                throw new CodedResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Question weights must be between 1 and 5.",
                    "invalid-question-weight"
                );
            }
        }
    }

    private void validateQuestionsBelongToWorkspace(int[] questionIds, String workspaceGuid) {
        if (questionIds == null) {
            throw new CodedResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Quiz questions must belong to the workspace.",
                "questions-not-in-workspace"
            );
        }
        if (questionIds.length == 0) {
            return;
        }

        Set<Integer> uniqueIds = Arrays.stream(questionIds).boxed().collect(Collectors.toSet());
        long matched = questionRepository.countByIdInAndWorkspaceGuid(uniqueIds, workspaceGuid);
        if (matched != uniqueIds.size()) {
            throw new CodedResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Quiz questions must belong to the workspace.",
                "questions-not-in-workspace"
            );
        }
    }
}
