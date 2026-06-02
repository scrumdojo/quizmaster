package cz.scrumdojo.quizmaster.workspace;

import java.util.List;

public record QuestionPageResponse(
    List<QuestionListItem> content,
    int totalPages,
    long totalElements,
    int size,
    int number
) {}
