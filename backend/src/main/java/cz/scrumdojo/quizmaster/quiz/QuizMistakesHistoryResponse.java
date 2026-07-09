package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import java.util.List;

public record QuizMistakesHistoryResponse(List<QuestionResponse> questions) {
    public static QuizMistakesHistoryResponse from(List<Question> questions) {
        return new QuizMistakesHistoryResponse(questions.stream().map(QuestionResponse::feedbackFrom).toList());
    }
}
