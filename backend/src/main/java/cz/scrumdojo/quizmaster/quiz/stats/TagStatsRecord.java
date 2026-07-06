package cz.scrumdojo.quizmaster.quiz.stats;

public record TagStatsRecord(
    String tag,
    int questions,
    int answered,
    int correctAnswers,
    int partiallyCorrectAnswers,
    int incorrectAnswers,
    int unanswered
) {}
