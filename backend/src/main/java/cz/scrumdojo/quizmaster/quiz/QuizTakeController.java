package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.attempt.*;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.question.*;
import cz.scrumdojo.quizmaster.quiz.leaderboard.QuizLeaderboardResponse;
import cz.scrumdojo.quizmaster.quiz.leaderboard.QuizLeaderboardService;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/quiz")
public class QuizTakeController {

    private final QuizService quizService;
    private final AttemptService attemptService;
    private final QuizLeaderboardService quizLeaderboardService;
    private final CohortRepository cohortRepository;
    private final Clock clock;

    public QuizTakeController(
        QuizService quizService,
        AttemptService attemptService,
        QuizLeaderboardService quizLeaderboardService,
        CohortRepository cohortRepository,
        Clock clock
    ) {
        this.quizService = quizService;
        this.attemptService = attemptService;
        this.quizLeaderboardService = quizLeaderboardService;
        this.cohortRepository = cohortRepository;
        this.clock = clock;
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizMetadataResponse> getQuiz(@PathVariable Integer id) {
        return ResponseHelper.okOrNotFound(quizService.findById(id).map(QuizMetadataResponse::from));
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<QuizLeaderboardResponse> getQuizLeaderboard(@PathVariable Integer id) {
        return ResponseHelper.okOrNotFound(quizLeaderboardService.getLeaderboard(id));
    }

    @PostMapping("/{id}/attempts")
    public ResponseEntity<?> createAttempt(
        @PathVariable Integer id,
        @RequestBody(required = false) QuizAttemptStartRequest request
    ) {
        Quiz quiz = requireAvailableQuiz(id);
        var cohort = resolveCohort(quiz, request);
        if (cohortRequested(request) && cohort.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cohort does not belong to this quiz."));
        }
        return ResponseEntity.ok(
            QuizAttemptStartResponse.from(
                attemptService.start(quiz, cohort.orElse(null), normalizedNickname(request), false, now())
            )
        );
    }

    private Optional<Cohort> resolveCohort(Quiz quiz, QuizAttemptStartRequest request) {
        if (!cohortRequested(request)) {
            return Optional.empty();
        }
        return cohortRepository.findByGuidAndQuizId(request.cohortGuid(), quiz.getId());
    }

    private boolean cohortRequested(QuizAttemptStartRequest request) {
        return request != null && request.cohortGuid() != null && !request.cohortGuid().isBlank();
    }

    private String normalizedNickname(QuizAttemptStartRequest request) {
        if (request == null || request.nickname() == null) {
            return null;
        }
        String nickname = request.nickname().trim();
        return nickname.isEmpty() ? null : nickname;
    }

    @GetMapping("/{quizId}/attempts/{attemptId}/buzzer-status")
    public ResponseEntity<BuzzerStatus> getBuzzerStatus(@PathVariable Integer quizId, @PathVariable Integer attemptId) {
        var quiz = requireQuiz(quizId);
        requireAttemptNotFinished(quizId, attemptId);
        return ResponseEntity.ok(attemptService.buzzerStatus(quiz, now()));
    }

    @PostMapping("/{quizId}/attempts/{attemptId}/timeout")
    public ResponseEntity<Void> recordTimeout(@PathVariable Integer quizId, @PathVariable Integer attemptId) {
        var attempt = requireAttemptNotFinished(quizId, attemptId);
        attemptService.timeout(attempt, now());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{quizId}/attempts/{attemptId}/evaluate")
    public ResponseEntity<QuizEvaluationResponse> evaluateQuiz(
        @PathVariable Integer quizId,
        @PathVariable Integer attemptId
    ) {
        var attempt = requireAttemptNotFinished(quizId, attemptId);
        var quiz = requireQuiz(quizId);
        attemptService.finish(attempt, now());
        var rows = attemptService.answeredQuestions(attempt.getId());
        int[] weights = weightsFor(quiz, rows);
        return ResponseEntity.ok(
            QuizEvaluationResponse.from(rows, quizService.loadQuestions(AttemptQuestion.questionIdsOf(rows)), weights)
        );
    }

    @PostMapping("/{quizId}/attempts/{attemptId}/questions/{questionId}/submit")
    public ResponseEntity<QuestionEvaluationResponse> submitAttemptQuestion(
        @PathVariable Integer quizId,
        @PathVariable Integer attemptId,
        @PathVariable Integer questionId,
        @RequestBody QuestionAnswerRequest request
    ) {
        var quiz = requireQuiz(quizId);
        requireAttemptNotFinished(quizId, attemptId);
        var question = requireQuestionInQuiz(quiz, questionId);
        var attemptQuestion = requireAttemptQuestion(attemptId, questionId);
        var status = attemptService.submitAnswer(quiz, attemptQuestion, question, request, now());
        var feedback = quiz.getMode() == QuizMode.LEARN ? QuestionResponse.feedbackFrom(question) : null;
        return ResponseEntity.ok(QuestionEvaluationResponse.from(status, feedback));
    }

    @PutMapping("/{quizId}/attempts/{attemptId}/questions/{questionId}/flag")
    public ResponseEntity<Void> flagAttemptQuestion(
        @PathVariable Integer quizId,
        @PathVariable Integer attemptId,
        @PathVariable Integer questionId,
        @RequestBody FlagRequest request
    ) {
        requireAttemptNotFinished(quizId, attemptId);
        var attemptQuestion = requireAttemptQuestion(attemptId, questionId);
        attemptService.setFlag(attemptQuestion, request.flagged());
        return ResponseEntity.noContent().build();
    }

    private Quiz requireQuiz(Integer quizId) {
        return quizService
            .findById(quizId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found with id: " + quizId));
    }

    private Quiz requireAvailableQuiz(Integer quizId) {
        var quiz = requireQuiz(quizId);

        if (!quiz.isAvailable(now())) throw new ResponseStatusException(
            HttpStatus.FORBIDDEN,
            "Quiz is not currently available."
        );

        return quiz;
    }

    private Question requireQuestionInQuiz(Quiz quiz, Integer questionId) {
        if (!quiz.hasQuestion(questionId)) throw new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Question " + questionId + " is not part of quiz " + quiz.getId()
        );
        return quizService
            .findQuestion(questionId)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found with id: " + questionId)
            );
    }

    private AttemptQuestion requireAttemptQuestion(Integer attemptId, Integer questionId) {
        return attemptService
            .findAttemptQuestion(attemptId, questionId)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Question " + questionId + " is not part of attempt " + attemptId
                )
            );
    }

    private Attempt requireAttemptNotFinished(Integer quizId, Integer attemptId) {
        var attempt = attemptService.findAttempt(quizId, attemptId);

        if (attempt.isEmpty()) throw new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Attempt not found with id: " + attemptId + " for quiz id: " + quizId
        );

        if (attempt.get().isFinished()) throw new ResponseStatusException(
            HttpStatus.CONFLICT,
            "Attempt with id " + attemptId + " is already finished."
        );

        return attempt.get();
    }

    private int[] weightsFor(Quiz quiz, List<AttemptQuestion> rows) {
        return rows
            .stream()
            .mapToInt(row -> quiz.weightForQuestion(row.getQuestionId()))
            .toArray();
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }
}
