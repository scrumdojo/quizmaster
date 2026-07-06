package cz.scrumdojo.quizmaster.quiz.stats;

import java.util.List;

public record QuizStatsResponse(
    SummaryStats summary,
    List<AttemptStatsRecord> attempts,
    List<QuestionStatsRecord> questionStatistics,
    List<TagStatsRecord> tagStatistics
) {}
