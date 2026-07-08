package cz.scrumdojo.quizmaster.quiz.epicbattle;

import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestion;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.quiz.CohortRepository;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EpicBattleService {

    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;
    private final AttemptQuestionRepository attemptQuestionRepository;
    private final CohortRepository cohortRepository;

    public EpicBattleService(
        QuizRepository quizRepository,
        AttemptRepository attemptRepository,
        AttemptQuestionRepository attemptQuestionRepository,
        CohortRepository cohortRepository
    ) {
        this.quizRepository = quizRepository;
        this.attemptRepository = attemptRepository;
        this.attemptQuestionRepository = attemptQuestionRepository;
        this.cohortRepository = cohortRepository;
    }

    @Transactional(readOnly = true)
    public Optional<EpicBattleResponse> getEpicBattle(String workspaceGuid, Integer quizId) {
        return quizRepository.findByIdAndWorkspaceGuid(quizId, workspaceGuid).map(this::buildEpicBattle);
    }

    private EpicBattleResponse buildEpicBattle(Quiz quiz) {
        var cohortAttempts = attemptRepository
            .findByQuizIdAndIsDryRunFalseOrderByStartedAtDesc(quiz.getId())
            .stream()
            .filter(attempt -> attempt.getCohortGuid() != null)
            .toList();
        var statsByCohortGuid = statsByCohortGuid(quiz, cohortAttempts);

        var rankedCohorts = cohortRepository
            .findByQuizIdOrderByName(quiz.getId())
            .stream()
            .map(cohort ->
                statsByCohortGuid.getOrDefault(cohort.getGuid(), new CohortStats(0.0, 0)).toResponse(cohort.getName())
            )
            .sorted(
                Comparator.comparingDouble(EpicBattleCohortResponse::points)
                    .reversed()
                    .thenComparing(EpicBattleCohortResponse::cohort)
            )
            .toArray(EpicBattleCohortResponse[]::new);

        return new EpicBattleResponse(rankedCohorts);
    }

    private Map<String, CohortStats> statsByCohortGuid(Quiz quiz, List<Attempt> cohortAttempts) {
        var attemptIds = cohortAttempts.stream().map(Attempt::getId).toList();
        var questionsByAttemptId = attemptIds.isEmpty()
            ? Map.<Integer, List<AttemptQuestion>>of()
            : attemptQuestionRepository
                  .findByAttemptIdInOrderByPosition(attemptIds)
                  .stream()
                  .collect(Collectors.groupingBy(AttemptQuestion::getAttemptId));

        var statsByCohortGuid = new HashMap<String, CohortStats>();
        for (Attempt attempt : cohortAttempts) {
            var rows = questionsByAttemptId.getOrDefault(attempt.getId(), List.of());
            double weightedPoints = AttemptQuestion.weightedTotalPoints(rows, weightsFor(quiz, rows));
            long hits = rows
                .stream()
                .filter(row -> row.getStatus().points() > 0)
                .count();
            statsByCohortGuid.merge(
                attempt.getCohortGuid(),
                new CohortStats(weightedPoints, (int) hits),
                CohortStats::plus
            );
        }
        return statsByCohortGuid;
    }

    private int[] weightsFor(Quiz quiz, List<AttemptQuestion> rows) {
        return rows
            .stream()
            .mapToInt(row -> quiz.weightForQuestion(row.getQuestionId()))
            .toArray();
    }

    private record CohortStats(double points, int hits) {
        CohortStats plus(CohortStats other) {
            return new CohortStats(points + other.points, hits + other.hits);
        }

        EpicBattleCohortResponse toResponse(String cohortName) {
            return new EpicBattleCohortResponse(cohortName, points, hits);
        }
    }
}
