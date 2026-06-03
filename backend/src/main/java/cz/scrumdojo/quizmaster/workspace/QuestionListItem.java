package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.question.Question;
import java.util.Arrays;
import java.util.List;

public record QuestionListItem(
    int id,
    String question,
    boolean isInAnyQuiz,
    List<String> quizTitles,
    String imageUrl,
    List<String> tags
) {
    public static QuestionListItem from(Question question, List<String> quizTitles) {
        String[] tags = question.getTags();
        return new QuestionListItem(
            question.getId(),
            question.getQuestion(),
            !quizTitles.isEmpty(),
            quizTitles,
            question.getImageUrl(),
            tags == null ? List.of() : Arrays.asList(tags)
        );
    }
}
