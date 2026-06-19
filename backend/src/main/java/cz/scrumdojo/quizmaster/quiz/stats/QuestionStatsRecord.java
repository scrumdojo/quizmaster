package cz.scrumdojo.quizmaster.quiz.stats;

public record QuestionStatsRecord(
    String question,
    int answered,
    int correctAnswers,
    int partiallyCorrectAnswers,
    int incorrectAnswers,
    int unanswered,
    int flagged
) {}
