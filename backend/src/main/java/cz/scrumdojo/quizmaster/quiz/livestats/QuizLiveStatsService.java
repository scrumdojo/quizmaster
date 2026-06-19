package cz.scrumdojo.quizmaster.quiz.livestats;

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
public class QuizLiveStatsService {

    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;
    private final AttemptQuestionRepository attemptQuestionRepository;
    private final CohortRepository cohortRepository;

    public QuizLiveStatsService(
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
    public Optional<QuizLiveStatsResponse> getLiveStats(String workspaceGuid, Integer quizId) {
        return quizRepository.findByIdAndWorkspaceGuid(quizId, workspaceGuid).map(this::buildLiveStats);
    }

    private QuizLiveStatsResponse buildLiveStats(Quiz quiz) {
        var cohortAttempts = attemptRepository
            .findByQuizIdAndIsDryRunFalseOrderByStartedAtDesc(quiz.getId())
            .stream()
            .filter(attempt -> attempt.getCohortGuid() != null)
            .toList();
        var pointsByCohortGuid = pointsByCohortGuid(quiz, cohortAttempts);

        var rankedCohorts = cohortRepository
            .findByQuizIdOrderByName(quiz.getId())
            .stream()
            .map(cohort ->
                new CohortLiveStatsRow(cohort.getName(), pointsByCohortGuid.getOrDefault(cohort.getGuid(), 0.0))
            )
            .sorted(
                Comparator.comparingDouble(CohortLiveStatsRow::points)
                    .reversed()
                    .thenComparing(CohortLiveStatsRow::name)
            )
            .toList();

        QuizLiveStatsCohortResponse[] response = new QuizLiveStatsCohortResponse[rankedCohorts.size()];
        for (int index = 0; index < rankedCohorts.size(); index++) {
            var cohort = rankedCohorts.get(index);
            response[index] = new QuizLiveStatsCohortResponse(index + 1, cohort.name(), cohort.points());
        }
        return new QuizLiveStatsResponse(response);
    }

    private Map<String, Double> pointsByCohortGuid(Quiz quiz, List<Attempt> cohortAttempts) {
        var attemptIds = cohortAttempts.stream().map(Attempt::getId).toList();
        var questionsByAttemptId = attemptIds.isEmpty()
            ? Map.<Integer, List<AttemptQuestion>>of()
            : attemptQuestionRepository
                  .findByAttemptIdInOrderByPosition(attemptIds)
                  .stream()
                  .collect(Collectors.groupingBy(AttemptQuestion::getAttemptId));

        var pointsByCohortGuid = new HashMap<String, Double>();
        for (Attempt attempt : cohortAttempts) {
            var rows = questionsByAttemptId.getOrDefault(attempt.getId(), List.of());
            double weightedPoints = AttemptQuestion.weightedTotalPoints(rows, weightsFor(quiz, rows));
            if (weightedPoints > 0) {
                pointsByCohortGuid.merge(attempt.getCohortGuid(), weightedPoints, Double::sum);
            }
        }
        return pointsByCohortGuid;
    }

    private int[] weightsFor(Quiz quiz, List<AttemptQuestion> rows) {
        return rows
            .stream()
            .mapToInt(row -> quiz.weightForQuestion(row.getQuestionId()))
            .toArray();
    }

    private record CohortLiveStatsRow(String name, double points) {}
}
