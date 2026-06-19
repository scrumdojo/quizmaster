package cz.scrumdojo.quizmaster.quiz;

import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.question.QuestionResponse;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class QuizService {

    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final CohortRepository cohortRepository;
    private final AttemptRepository attemptRepository;

    public QuizService(
        QuestionRepository questionRepository,
        QuizRepository quizRepository,
        CohortRepository cohortRepository,
        AttemptRepository attemptRepository
    ) {
        this.questionRepository = questionRepository;
        this.quizRepository = quizRepository;
        this.cohortRepository = cohortRepository;
        this.attemptRepository = attemptRepository;
    }

    public Optional<Quiz> findById(Integer id) {
        return quizRepository.findById(id);
    }

    public Optional<Question> findQuestion(Integer questionId) {
        return questionRepository.findById(questionId);
    }

    public Optional<QuizResponse> getQuiz(Integer id) {
        return quizRepository.findById(id).map(quiz -> toQuizResponse(quiz, loadQuestions(quiz)));
    }

    public Optional<QuizResponse> getWorkspaceQuiz(String workspaceGuid, Integer id) {
        return quizRepository
            .findByIdAndWorkspaceGuid(id, workspaceGuid)
            .map(quiz -> toQuizResponse(quiz, loadQuestions(quiz)));
    }

    private QuizResponse toQuizResponse(Quiz quiz, List<Question> questions) {
        QuestionResponse[] questionResponses = questions
            .stream()
            .map(QuestionResponse::from)
            .toArray(QuestionResponse[]::new);

        QuizCohortResponse[] cohorts = cohortRepository
            .findByQuizIdOrderByName(quiz.getId())
            .stream()
            .map(cohort -> QuizCohortResponse.from(cohort, canDelete(cohort)))
            .toArray(QuizCohortResponse[]::new);

        return new QuizResponse(
            quiz.getId(),
            quiz.getTitle(),
            quiz.getDescription(),
            quiz.getStartAt(),
            quiz.getEndAt(),
            questionResponses,
            quiz.getQuestionWeights(),
            quiz.getMode(),
            quiz.getDifficulty(),
            quiz.getPassScore(),
            quiz.getTimeLimit(),
            quiz.getRandomQuestionCount(),
            cohorts
        );
    }

    public boolean canDelete(Cohort cohort) {
        return !attemptRepository.existsByQuizIdAndCohortGuid(cohort.getQuiz().getId(), cohort.getGuid());
    }

    public List<Question> drawQuestions(Quiz quiz) {
        List<Question> questions = new ArrayList<>(loadQuestions(quiz));

        Integer randomCount = quiz.getRandomQuestionCount();
        if (randomCount != null && randomCount > 0 && !questions.isEmpty()) {
            Collections.shuffle(questions);
            questions = questions.subList(0, Math.min(randomCount, questions.size()));
        }

        return questions;
    }

    public List<Question> loadQuestions(Quiz quiz) {
        return loadQuestions(quiz.getQuestionIds());
    }

    public List<Question> loadQuestions(int[] questionIds) {
        if (questionIds == null) {
            return List.of();
        }

        List<Integer> ids = Arrays.stream(questionIds).boxed().toList();
        Map<Integer, Question> questionsById = questionRepository
            .findAllById(ids)
            .stream()
            .collect(Collectors.toMap(Question::getId, Function.identity()));
        return ids.stream().map(questionsById::get).filter(Objects::nonNull).toList();
    }
}
