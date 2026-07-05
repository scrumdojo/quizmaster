package cz.scrumdojo.quizmaster.aiassistant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import cz.scrumdojo.quizmaster.TestFixtures;
import cz.scrumdojo.quizmaster.question.Question;
import cz.scrumdojo.quizmaster.question.QuestionRepository;
import cz.scrumdojo.quizmaster.workspace.Workspace;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Tag("ai")
class AiAssistantEmbeddingDuplicateAvoidanceTest {

    private static final String EXISTING_QUESTION = "Which country is the largest producer of coffee?";

    @Autowired
    private AiAssistantService aiAssistantService;

    @Autowired
    private QuestionEmbeddingService questionEmbeddingService;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TestFixtures fixtures;

    @Value("${ai.token:}")
    private String apiToken;

    @Test
    void chatAvoidsExistingEmbeddedWorkspaceQuestion() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        Workspace workspace = workspaceWithEmbeddedQuestion(EXISTING_QUESTION);

        RobinChatResponse response = chat("Generate an exact question: " + EXISTING_QUESTION, workspace, null);

        // The model may draft an alternative or the duplicate may be filtered into a
        // notice — either way no returned draft duplicates the workspace.
        assertThat(response.drafts().stream().map(QuestionDraft::question).map(this::normalizeText)).doesNotContain(
            normalizeText(EXISTING_QUESTION)
        );
    }

    @Test
    void chatExcludesQuestionBeingEditedFromDuplicateComparisons() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        Workspace workspace = workspaceWithEmbeddedQuestion(EXISTING_QUESTION);
        Question editedQuestion = questionRepository.findByWorkspaceGuidOrderByIdDesc(workspace.getGuid()).getFirst();

        RobinChatResponse response = chat(
            "Improve this exact question without changing its meaning: " + EXISTING_QUESTION,
            workspace,
            editedQuestion.getId()
        );

        assertThat(response.drafts()).isNotEmpty();
        assertThat(response.drafts().getFirst().question()).isNotBlank();
    }

    @Test
    void chatMultiQuestionTurnAvoidsExistingEmbeddedWorkspaceQuestion() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        Workspace workspace = workspaceWithEmbeddedQuestion(EXISTING_QUESTION);

        RobinChatResponse response = chat(
            "Generate 2 single-choice questions about coffee. Include the exact question: " + EXISTING_QUESTION,
            workspace,
            null
        );

        assertThat(response.drafts().stream().map(QuestionDraft::question).map(this::normalizeText)).doesNotContain(
            normalizeText(EXISTING_QUESTION)
        );
    }

    @Test
    void chatReportsExactDuplicateAsNoticeInsteadOfError() {
        assumeTrue(!apiToken.isBlank(), "ai.token not configured");

        // No embedding on the seeded question: the uniqueness rule stays out of the
        // system prompt, so the model reproduces the verbatim request and only the
        // deterministic exact-text match can catch it.
        Workspace workspace = fixtures.save(fixtures.workspace());
        fixtures.save(fixtures.questionIn(workspace).question(EXISTING_QUESTION).build());

        RobinChatResponse response = chat(
            "Create exactly this question, verbatim: \"" + EXISTING_QUESTION + "\"",
            workspace,
            null
        );

        assertThat(response.notice()).isNotBlank();
        assertThat(response.drafts().stream().map(QuestionDraft::question).map(this::normalizeText)).doesNotContain(
            normalizeText(EXISTING_QUESTION)
        );
    }

    private RobinChatResponse chat(String prompt, Workspace workspace, Integer excludedQuestionId) {
        return aiAssistantService.chat(
            List.of(new RobinChatRequest.RobinChatMessage("user", prompt, null)),
            workspace.getGuid(),
            excludedQuestionId
        );
    }

    private Workspace workspaceWithEmbeddedQuestion(String questionText) {
        Workspace workspace = fixtures.save(fixtures.workspace());
        Question question = fixtures.questionIn(workspace).question(questionText).build();
        questionEmbeddingService.embedForSave(question);
        questionRepository.save(question);
        return workspace;
    }

    private String normalizeText(String value) {
        return value
            .trim()
            .toLowerCase(java.util.Locale.ROOT)
            .replaceAll("[^\\p{L}\\p{N}]+", " ")
            .replaceAll("\\s+", " ")
            .trim();
    }
}
