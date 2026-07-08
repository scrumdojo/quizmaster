package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.attempt.AttemptStart;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionTakeResponse;
import java.util.List;

public record QuizAttemptStartResponse(
    Integer attemptId,
    QuestionTakeResponse[] questions,
    boolean[] questionReleased
) {
    public static QuizAttemptStartResponse from(AttemptStart started, Quiz quiz) {
        List<Question> drawnQuestions = started.drawnQuestions();
        boolean[] released = new boolean[drawnQuestions.size()];
        for (int i = 0; i < drawnQuestions.size(); i++) {
            released[i] = quiz.isReleased(drawnQuestions.get(i).getId());
        }
        return new QuizAttemptStartResponse(
            started.attempt().getId(),
            drawnQuestions.stream().map(QuestionTakeResponse::from).toArray(QuestionTakeResponse[]::new),
            released
        );
    }
}
