package cz.scrumdojo.quizmaster.workspace;

import java.util.List;

public record QuestionPageResponse(
    List<QuestionListItem> content,
    List<String> availableTags,
    int totalPages,
    long totalElements,
    int size,
    int number
) {}
