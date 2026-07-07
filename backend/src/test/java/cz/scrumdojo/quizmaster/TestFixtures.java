package cz.scrumdojo.quizmaster;

import cz.scrumdojo.quizmaster.attempt.AnswerStatus;
import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestion;
import cz.scrumdojo.quizmaster.attempt.AttemptQuestionRepository;
import cz.scrumdojo.quizmaster.attempt.AttemptRepository;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.question.QuestionRequest;
import cz.scrumdojo.quizmaster.question.QuestionType;
import cz.scrumdojo.quizmaster.quiz.Difficulty;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.quiz.QuizMode;
import cz.scrumdojo.quizmaster.quiz.QuizRepository;
import cz.scrumdojo.quizmaster.quiz.QuizRequest;
import cz.scrumdojo.quizmaster.workspace.Workspace;
import cz.scrumdojo.quizmaster.workspace.WorkspaceRepository;
import java.time.LocalDateTime;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class TestFixtures {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Autowired
    private AttemptQuestionRepository attemptQuestionRepository;

    public Question.QuestionBuilder question() {
        return Question.builder()
            .question("What is the capital of Italy?")
            .answers(new String[] { "Naples", "Rome", "Florence", "Palermo" })
            .correctAnswers(new int[] { 1 })
            .explanations(new String[] { "No", "Correct!", "No", "No" })
            .isEasy(false)
            .questionType(QuestionType.SINGLE)
            .tags(new String[0]);
    }

    public Question.QuestionBuilder questionIn(Workspace workspace) {
        return question().workspaceGuid(workspace.getGuid());
    }

    public QuestionRequest questionRequest() {
        return new QuestionRequest(
            "What is the capital of Italy?",
            new String[] { "Naples", "Rome", "Florence", "Palermo" },
            new int[] { 1 },
            new String[] { "No", "Correct!", "No", "No" },
            null,
            false,
            null,
            QuestionType.SINGLE,
            0.0,
            new String[0]
        );
    }

    public QuestionRequest multipleChoiceQuestionRequest() {
        return new QuestionRequest(
            "Which are cities in Italy?",
            new String[] { "Naples", "Rome", "Paris", "Berlin" },
            new int[] { 0, 1 },
            new String[] { "Yes!", "Yes!", "No, France", "No, Germany" },
            null,
            false,
            null,
            QuestionType.MULTIPLE,
            0.0,
            new String[0]
        );
    }

    public QuestionRequest questionRequestWithImage(String imageUrl) {
        return new QuestionRequest(
            "What is the capital of Italy?",
            new String[] { "Naples", "Rome", "Florence", "Palermo" },
            new int[] { 1 },
            new String[] { "No", "Correct!", "No", "No" },
            null,
            false,
            imageUrl,
            QuestionType.SINGLE,
            0.0,
            new String[0]
        );
    }

    public QuizRequest quizRequest(Question... questions) {
        int[] questionIds = Arrays.stream(questions).mapToInt(Question::getId).toArray();

        return new QuizRequest(
            "Test Quiz",
            "Test Description",
            null,
            null,
            questionIds,
            null,
            QuizMode.LEARN,
            Difficulty.KEEP_QUESTION,
            85,
            null,
            1
        );
    }

    public Question.QuestionBuilder multipleChoiceQuestion() {
        return Question.builder()
            .question("Which are cities in Italy?")
            .answers(new String[] { "Naples", "Rome", "Paris", "Berlin" })
            .correctAnswers(new int[] { 0, 1 })
            .explanations(new String[] { "Yes!", "Yes!", "No, France", "No, Germany" })
            .isEasy(false)
            .questionType(QuestionType.MULTIPLE)
            .tags(new String[0]);
    }

    public Question save(Question.QuestionBuilder builder) {
        return questionRepository.save(builder.build());
    }

    public Question save(Question question) {
        return questionRepository.save(question);
    }

    public Quiz.QuizBuilder quiz(Question... questions) {
        int[] questionIds = Arrays.stream(questions).mapToInt(Question::getId).toArray();

        return Quiz.builder()
            .title("Test Quiz")
            .description("Test Description")
            .startAt(null)
            .endAt(null)
            .mode(QuizMode.LEARN)
            .difficulty(Difficulty.KEEP_QUESTION)
            .passScore(85)
            .questionIds(questionIds)
            .randomQuestionCount(1);
    }

    public Quiz.QuizBuilder quizIn(Workspace workspace) {
        return quiz().workspaceGuid(workspace.getGuid());
    }

    public Quiz save(Quiz.QuizBuilder builder) {
        return quizRepository.save(builder.build());
    }

    public Quiz save(Quiz quiz) {
        return quizRepository.save(quiz);
    }

    public Workspace.WorkspaceBuilder workspace() {
        return Workspace.builder().title("Test Workspace").createdAt(LocalDateTime.now());
    }

    public Workspace save(Workspace.WorkspaceBuilder builder) {
        return workspaceRepository.save(builder.build());
    }

    public Workspace save(Workspace workspace) {
        return workspaceRepository.save(workspace);
    }

    public Attempt.AttemptBuilder attempt(Quiz quiz) {
        return Attempt.builder()
            .quizId(quiz.getId())
            .startedAt(LocalDateTime.now().minusMinutes(2))
            .finishedAt(LocalDateTime.now());
    }

    public Attempt.AttemptBuilder attemptInProgress(Quiz quiz) {
        return Attempt.builder().quizId(quiz.getId()).startedAt(LocalDateTime.now());
    }

    public Attempt.AttemptBuilder attemptTimedOut(Quiz quiz) {
        return Attempt.builder()
            .quizId(quiz.getId())
            .startedAt(LocalDateTime.now().minusMinutes(5))
            .finishedAt(LocalDateTime.now())
            .timedOutAt(LocalDateTime.now().minusMinutes(5).plusSeconds(300));
    }

    public Attempt.AttemptBuilder attemptAbandoned(Quiz quiz) {
        return Attempt.builder()
            .quizId(quiz.getId())
            .startedAt(LocalDateTime.now().minusMinutes(5))
            .timedOutAt(LocalDateTime.now().minusMinutes(5).plusSeconds(300));
    }

    public Attempt save(Attempt.AttemptBuilder builder) {
        return attemptRepository.save(builder.build());
    }

    public Attempt save(Attempt.AttemptBuilder builder, Question... drawn) {
        Attempt persisted = attemptRepository.save(builder.build());
        for (int position = 0; position < drawn.length; position++) {
            attemptQuestionRepository.save(AttemptQuestion.drawn(persisted.getId(), drawn[position].getId(), position));
        }
        return persisted;
    }

    public void score(Attempt attempt, Question question, AnswerStatus status) {
        score(attempt, question, status, LocalDateTime.now());
    }

    public void score(Attempt attempt, Question question, AnswerStatus status, LocalDateTime answeredAt) {
        AttemptQuestion row = attemptQuestionRepository
            .findByAttemptIdAndQuestionId(attempt.getId(), question.getId())
            .orElseThrow();
        row.recordOutcome(QuizMode.EXAM, status, answeredAt);
        attemptQuestionRepository.save(row);
    }

    public Attempt save(Attempt attempt) {
        return attemptRepository.save(attempt);
    }
}
