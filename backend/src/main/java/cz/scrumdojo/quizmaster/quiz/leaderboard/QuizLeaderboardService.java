package cz.scrumdojo.quizmaster.quiz.leaderboard;

import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestion;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.quiz.CohortRepository;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuizLeaderboardService {

    private final QuizRepository quizRepository;
    private final AttemptRepository attemptRepository;
    private final AttemptQuestionRepository attemptQuestionRepository;
    private final CohortRepository cohortRepository;

    public QuizLeaderboardService(
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
    public Optional<QuizLeaderboardResponse> getLeaderboard(Integer quizId) {
        return quizRepository.findById(quizId).map(this::buildLeaderboard);
    }

    private QuizLeaderboardResponse buildLeaderboard(Quiz quiz) {
        var finishedAttempts = attemptRepository
            .findByQuizIdAndIsDryRunFalseOrderByStartedAtDesc(quiz.getId())
            .stream()
            .filter(attempt -> attempt.getFinishedAt() != null)
            .toList();
        var scoresByAttemptId = scoresByAttemptId(finishedAttempts);

        return new QuizLeaderboardResponse(rankCohorts(quiz, finishedAttempts, scoresByAttemptId), rankIndividuals(finishedAttempts, scoresByAttemptId));
    }

    private Map<Integer, List<AttemptQuestion>> scoresByAttemptId(List<Attempt> attempts) {
        var attemptIds = attempts.stream().map(Attempt::getId).toList();

        return attemptIds.isEmpty()
            ? Map.of()
            : attemptQuestionRepository
                  .findByAttemptIdInOrderByPosition(attemptIds)
                  .stream()
                  .collect(Collectors.groupingBy(AttemptQuestion::getAttemptId));
    }

    private QuizLeaderboardCohortResponse[] rankCohorts(
        Quiz quiz,
        List<Attempt> finishedAttempts,
        Map<Integer, List<AttemptQuestion>> scoresByAttemptId
    ) {
        var finishedCohortAttempts = finishedAttempts
            .stream()
            .filter(attempt -> attempt.getCohortGuid() != null)
            .toList();
        var scoresByCohort = new HashMap<String, List<Integer>>();
        for (Attempt attempt : finishedCohortAttempts) {
            scoresByCohort
                .computeIfAbsent(attempt.getCohortGuid(), ignored -> new ArrayList<>())
                .add(AttemptQuestion.percentageScore(scoresByAttemptId.getOrDefault(attempt.getId(), List.of())));
        }

        var rankedCohorts = cohortRepository
            .findByQuizIdOrderByName(quiz.getId())
            .stream()
            .map(cohort ->
                new CohortLeaderboardRow(cohort.getName(), averageScore(scoresByCohort.get(cohort.getGuid())))
            )
            .sorted(
                Comparator.comparingInt(CohortLeaderboardRow::score)
                    .reversed()
                    .thenComparing(CohortLeaderboardRow::name)
            )
            .toList();

        QuizLeaderboardCohortResponse[] response = new QuizLeaderboardCohortResponse[rankedCohorts.size()];
        for (int index = 0; index < rankedCohorts.size(); index++) {
            var cohort = rankedCohorts.get(index);
            response[index] = new QuizLeaderboardCohortResponse(index + 1, cohort.name(), cohort.score());
        }
        return response;
    }

    private QuizLeaderboardIndividualResponse[] rankIndividuals(
        List<Attempt> finishedAttempts,
        Map<Integer, List<AttemptQuestion>> scoresByAttemptId
    ) {
        var rankedIndividuals = finishedAttempts
            .stream()
            .filter(attempt -> attempt.getNickname() != null)
            .map(attempt -> new IndividualLeaderboardRow(attempt.getNickname(), scoreForAttempt(attempt, scoresByAttemptId)))
            .sorted(
                Comparator.comparingInt(IndividualLeaderboardRow::score)
                    .reversed()
                    .thenComparing(IndividualLeaderboardRow::nickname)
            )
            .toList();

        QuizLeaderboardIndividualResponse[] response = new QuizLeaderboardIndividualResponse[rankedIndividuals.size()];
        for (int index = 0; index < rankedIndividuals.size(); index++) {
            var individual = rankedIndividuals.get(index);
            response[index] = new QuizLeaderboardIndividualResponse(index + 1, individual.nickname(), individual.score());
        }
        return response;
    }

    private int scoreForAttempt(Attempt attempt, Map<Integer, List<AttemptQuestion>> scoresByAttemptId) {
        return AttemptQuestion.percentageScore(scoresByAttemptId.getOrDefault(attempt.getId(), List.of()));
    }

    private int averageScore(List<Integer> scores) {
        if (scores == null || scores.isEmpty()) {
            return 0;
        }
        int total = scores.stream().mapToInt(Integer::intValue).sum();
        return Math.round((float) total / scores.size());
    }

    private record CohortLeaderboardRow(String name, int score) {}

    private record IndividualLeaderboardRow(String nickname, int score) {}
}
