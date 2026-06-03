package cz.scrumdojo.quizmaster.question;

import cz.scrumdojo.quizmaster.attempt.AnswerStatus;
import java.util.Arrays;
import java.util.HashSet;
import org.springframework.stereotype.Service;

@Service
public class QuestionScoringService {

    private static final double FLOAT_EPSILON = 1e-9;

    public QuestionEvaluationResponse evaluate(Question question, QuestionAnswerRequest answer) {
        return QuestionEvaluationResponse.from(score(question, answer), QuestionResponse.feedbackFrom(question));
    }

    public AnswerStatus score(Question question, QuestionAnswerRequest answer) {
        return question.getQuestionType() == QuestionType.NUMERICAL
            ? scoreNumerical(question, answer)
            : scoreChoice(question, answer);
    }

    private AnswerStatus scoreNumerical(Question question, QuestionAnswerRequest answer) {
        if (
            answer == null ||
            answer.value() == null ||
            question.getAnswers() == null ||
            question.getAnswers().length == 0
        ) {
            return AnswerStatus.INCORRECT;
        }
        double correct = Double.parseDouble(question.getAnswers()[0]);
        double tolerance = question.getTolerance() != null ? question.getTolerance() : 0;
        return Math.abs(answer.value() - correct) <= tolerance + FLOAT_EPSILON
            ? AnswerStatus.CORRECT
            : AnswerStatus.INCORRECT;
    }

    private AnswerStatus scoreChoice(Question question, QuestionAnswerRequest answer) {
        if (answer == null || answer.selectedIdxs() == null || answer.selectedIdxs().length == 0) {
            return AnswerStatus.INCORRECT;
        }

        var correct = question.getCorrectAnswers();
        if (correct == null || correct.length == 0) {
            return AnswerStatus.INCORRECT;
        }

        var correctSet = new HashSet<Integer>();
        Arrays.stream(correct).forEach(correctSet::add);
        var selectedSet = new HashSet<Integer>();
        Arrays.stream(answer.selectedIdxs()).forEach(selectedSet::add);

        int matched = 0;
        for (int selected : selectedSet) {
            if (correctSet.contains(selected)) matched++;
        }

        int missedCorrect = correct.length - matched;
        int selectedIncorrect = selectedSet.size() - matched;
        int mistakes = missedCorrect + selectedIncorrect;

        if (mistakes == 0) return AnswerStatus.CORRECT;
        if (mistakes == 1) return AnswerStatus.PARTIAL;
        return AnswerStatus.INCORRECT;
    }
}
