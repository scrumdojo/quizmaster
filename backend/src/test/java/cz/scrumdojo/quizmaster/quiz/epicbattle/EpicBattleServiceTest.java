package cz.scrumdojo.quizmaster.quiz.epicbattle;

import static org.assertj.core.api.Assertions.assertThat;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.attempt.AnswerStatus;
import cz.scrumdojo.quizmaster.attempt.Attempt;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.quiz.Cohort;
import cz.scrumdojo.quizmaster.quiz.Quiz;
import cz.scrumdojo.quizmaster.workspace.Workspace;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class EpicBattleServiceTest {

    @Autowired
    private EpicBattleService epicBattleService;

    @Autowired
    private TestFixtures fixtures;

    @Test
    public void countsHitAndPointsForCorrectAnswer() {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(question)
                .workspaceGuid(workspace.getGuid())
                .randomQuestionCount(null)
                .cohorts(List.of(Cohort.builder().name("Alpha").build(), Cohort.builder().name("Beta").build()))
                .build()
        );
        Cohort alpha = quiz
            .getCohorts()
            .stream()
            .filter(c -> c.getName().equals("Alpha"))
            .findFirst()
            .orElseThrow();
        Attempt attempt = fixtures.save(fixtures.attempt(quiz).cohortGuid(alpha.getGuid()), question);
        fixtures.score(attempt, question, AnswerStatus.CORRECT);

        EpicBattleResponse response = epicBattleService
            .getEpicBattle(quiz.getWorkspaceGuid(), quiz.getId())
            .orElseThrow();

        var alphaRow = cohortRow(response, "Alpha");
        assertThat(alphaRow.points()).isEqualTo(1.0);
        assertThat(alphaRow.hits()).isEqualTo(1);
    }

    @Test
    public void partialAnswerCountsAsOneHitWithHalfPoint() {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(question)
                .workspaceGuid(workspace.getGuid())
                .randomQuestionCount(null)
                .cohorts(List.of(Cohort.builder().name("Alpha").build()))
                .build()
        );
        Cohort alpha = quiz.getCohorts().getFirst();
        Attempt attempt = fixtures.save(fixtures.attempt(quiz).cohortGuid(alpha.getGuid()), question);
        fixtures.score(attempt, question, AnswerStatus.PARTIAL);

        EpicBattleResponse response = epicBattleService
            .getEpicBattle(quiz.getWorkspaceGuid(), quiz.getId())
            .orElseThrow();

        var alphaRow = cohortRow(response, "Alpha");
        assertThat(alphaRow.points()).isEqualTo(0.5);
        assertThat(alphaRow.hits()).isEqualTo(1);
    }

    @Test
    public void heavierQuestionContributesMorePointsButSameHitCount() {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question q1 = fixtures.save(fixtures.question());
        Question q2 = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(q1, q2)
                .workspaceGuid(workspace.getGuid())
                .randomQuestionCount(null)
                .questionWeights(new int[] { 3, 1 })
                .cohorts(List.of(Cohort.builder().name("Alpha").build()))
                .build()
        );
        Cohort alpha = quiz.getCohorts().getFirst();
        Attempt attempt = fixtures.save(fixtures.attempt(quiz).cohortGuid(alpha.getGuid()), q1, q2);
        fixtures.score(attempt, q1, AnswerStatus.CORRECT);
        fixtures.score(attempt, q2, AnswerStatus.CORRECT);

        EpicBattleResponse response = epicBattleService
            .getEpicBattle(quiz.getWorkspaceGuid(), quiz.getId())
            .orElseThrow();

        var alphaRow = cohortRow(response, "Alpha");
        assertThat(alphaRow.points()).isEqualTo(4.0);
        assertThat(alphaRow.hits()).isEqualTo(2);
    }

    @Test
    public void cohortWithNoAttemptsHasZeroPointsAndHits() {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.save(fixtures.question());
        Quiz quiz = fixtures.save(
            fixtures
                .quiz(question)
                .workspaceGuid(workspace.getGuid())
                .randomQuestionCount(null)
                .cohorts(List.of(Cohort.builder().name("Alpha").build(), Cohort.builder().name("Beta").build()))
                .build()
        );

        EpicBattleResponse response = epicBattleService
            .getEpicBattle(quiz.getWorkspaceGuid(), quiz.getId())
            .orElseThrow();

        var betaRow = cohortRow(response, "Beta");
        assertThat(betaRow.points()).isEqualTo(0.0);
        assertThat(betaRow.hits()).isEqualTo(0);
    }

    private EpicBattleCohortResponse cohortRow(EpicBattleResponse response, String cohortName) {
        return List.of(response.cohorts())
            .stream()
            .filter(c -> c.cohort().equals(cohortName))
            .findFirst()
            .orElseThrow();
    }
}
