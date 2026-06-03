package cz.scrumdojo.quizmaster.quiz.leaderboard;

public record QuizLeaderboardResponse(
	QuizLeaderboardCohortResponse[] cohorts,
	QuizLeaderboardIndividualResponse[] individuals
) {}
