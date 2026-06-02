package cz.scrumdojo.quizmaster.workspace;

import java.util.List;

public record QuizPageResponse(List<QuizListItem> content, int totalPages, int size, int number) {}
