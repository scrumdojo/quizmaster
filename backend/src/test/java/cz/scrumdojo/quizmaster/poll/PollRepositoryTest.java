package cz.scrumdojo.quizmaster.poll;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class PollRepositoryTest {

    @Autowired
    private PollRepository pollRepository;

    private Poll poll(String workspaceGuid, String question) {
        return Poll.builder()
            .workspaceGuid(workspaceGuid)
            .question(question)
            .answers(List.of(new PollAnswer(1, "Weekly", null), new PollAnswer(2, "Monthly", null)))
            .build();
    }

    @Test
    public void savedPollIsFoundByIdWithItsAnswers() {
        String workspaceGuid = UUID.randomUUID().toString();
        Poll saved = pollRepository.save(poll(workspaceGuid, "How often do you run retrospectives?"));

        var found = pollRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getWorkspaceGuid()).isEqualTo(workspaceGuid);
        assertThat(found.get().getQuestion()).isEqualTo("How often do you run retrospectives?");
        assertThat(found.get().getAnswers()).containsExactly(
            new PollAnswer(1, "Weekly", null),
            new PollAnswer(2, "Monthly", null)
        );
    }

    @Test
    public void findByWorkspaceGuidReturnsOnlyItsPollsNewestFirst() {
        String workspaceGuid = UUID.randomUUID().toString();
        Poll first = pollRepository.save(poll(workspaceGuid, "First poll"));
        Poll second = pollRepository.save(poll(workspaceGuid, "Second poll"));
        pollRepository.save(poll(UUID.randomUUID().toString(), "Other workspace poll"));

        var polls = pollRepository.findByWorkspaceGuid(workspaceGuid);

        assertThat(polls).extracting(Poll::getId).containsExactly(second.getId(), first.getId());
    }

    @Test
    public void findByIdAndWorkspaceGuidRejectsForeignWorkspace() {
        Poll saved = pollRepository.save(poll(UUID.randomUUID().toString(), "Scoped poll"));

        assertThat(pollRepository.findByIdAndWorkspaceGuid(saved.getId(), saved.getWorkspaceGuid())).isPresent();
        assertThat(pollRepository.findByIdAndWorkspaceGuid(saved.getId(), UUID.randomUUID().toString())).isEmpty();
    }

    @Test
    public void voteCountsStartAtZeroForEveryAnswer() {
        Poll saved = pollRepository.save(poll(UUID.randomUUID().toString(), "Fresh poll"));

        assertThat(pollRepository.getVoteCounts(saved.getId())).isEqualTo(Map.of(1, 0, 2, 0));
    }

    @Test
    public void savedVotesAccumulatePerAnswer() {
        Poll saved = pollRepository.save(poll(UUID.randomUUID().toString(), "Voted poll"));

        pollRepository.saveVote(saved.getId(), 1);
        pollRepository.saveVote(saved.getId(), 1);
        pollRepository.saveVote(saved.getId(), 2);

        assertThat(pollRepository.getVoteCounts(saved.getId())).isEqualTo(Map.of(1, 2, 2, 1));
    }

    @Test
    public void updatedQuestionAndAnswerTextsKeepCollectedVotes() {
        Poll saved = pollRepository.save(poll(UUID.randomUUID().toString(), "Original question"));
        pollRepository.saveVote(saved.getId(), 1);

        pollRepository.update(
            saved
                .toBuilder()
                .question("Updated question")
                .answers(List.of(new PollAnswer(1, "Every week", null), new PollAnswer(2, "Monthly", null)))
                .build()
        );

        var found = pollRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getQuestion()).isEqualTo("Updated question");
        assertThat(found.get().getAnswers()).containsExactly(
            new PollAnswer(1, "Every week", null),
            new PollAnswer(2, "Monthly", null)
        );
        assertThat(pollRepository.getVoteCounts(saved.getId())).isEqualTo(Map.of(1, 1, 2, 0));
    }

    @Test
    public void savedAnswerWithBlankTextAndImageIsPersisted() {
        Poll saved = pollRepository.save(
            poll(UUID.randomUUID().toString(), "Which retro format do you prefer?")
                .toBuilder()
                .answers(
                    List.of(new PollAnswer(1, "", "https://example.com/starfish.png"), new PollAnswer(2, "4Ls", null))
                )
                .build()
        );

        var found = pollRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getAnswers()).containsExactly(
            new PollAnswer(1, "", "https://example.com/starfish.png"),
            new PollAnswer(2, "4Ls", null)
        );
    }

    @Test
    public void savedAnswerImageUrlIsPersisted() {
        Poll saved = pollRepository.save(
            poll(UUID.randomUUID().toString(), "Which retro format do you prefer?")
                .toBuilder()
                .answers(
                    List.of(
                        new PollAnswer(1, "Starfish", "https://example.com/starfish.png"),
                        new PollAnswer(2, "4Ls", null)
                    )
                )
                .build()
        );

        var found = pollRepository.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getAnswers()).containsExactly(
            new PollAnswer(1, "Starfish", "https://example.com/starfish.png"),
            new PollAnswer(2, "4Ls", null)
        );
    }

    @Test
    public void updatingAnswerImageUrlPersistsAndKeepsVotes() {
        Poll saved = pollRepository.save(poll(UUID.randomUUID().toString(), "Image update poll"));
        pollRepository.saveVote(saved.getId(), 1);

        pollRepository.update(
            saved
                .toBuilder()
                .answers(
                    List.of(
                        new PollAnswer(1, "Weekly", "https://example.com/weekly.png"),
                        new PollAnswer(2, "Monthly", null)
                    )
                )
                .build()
        );

        var found = pollRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getAnswers()).containsExactly(
            new PollAnswer(1, "Weekly", "https://example.com/weekly.png"),
            new PollAnswer(2, "Monthly", null)
        );
        assertThat(pollRepository.getVoteCounts(saved.getId())).isEqualTo(Map.of(1, 1, 2, 0));
    }

    @Test
    public void removingAnswerImageUrlClearsIt() {
        Poll saved = pollRepository.save(
            poll(UUID.randomUUID().toString(), "Image removal poll")
                .toBuilder()
                .answers(
                    List.of(
                        new PollAnswer(1, "Weekly", "https://example.com/weekly.png"),
                        new PollAnswer(2, "Monthly", null)
                    )
                )
                .build()
        );

        pollRepository.update(
            saved
                .toBuilder()
                .answers(List.of(new PollAnswer(1, "Weekly", null), new PollAnswer(2, "Monthly", null)))
                .build()
        );

        var found = pollRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getAnswers()).containsExactly(
            new PollAnswer(1, "Weekly", null),
            new PollAnswer(2, "Monthly", null)
        );
    }

    @Test
    public void removedAnswerLosesItsVotesAndAddedAnswerStartsAtZero() {
        Poll saved = pollRepository.save(poll(UUID.randomUUID().toString(), "Reshaped poll"));
        pollRepository.saveVote(saved.getId(), 1);
        pollRepository.saveVote(saved.getId(), 2);

        Poll updated = pollRepository.update(
            saved
                .toBuilder()
                .answers(List.of(new PollAnswer(2, "Monthly", null), new PollAnswer(null, "Yearly", null)))
                .build()
        );

        assertThat(updated.getAnswers()).containsExactly(
            new PollAnswer(2, "Monthly", null),
            new PollAnswer(3, "Yearly", null)
        );
        assertThat(pollRepository.getVoteCounts(saved.getId())).isEqualTo(Map.of(2, 1, 3, 0));
    }

    @Test
    public void deletedPollIsGoneWithItsVotes() {
        Poll saved = pollRepository.save(poll(UUID.randomUUID().toString(), "Doomed poll"));
        pollRepository.saveVote(saved.getId(), 1);

        int deleted = pollRepository.deleteByIdAndWorkspaceGuid(saved.getId(), saved.getWorkspaceGuid());

        assertThat(deleted).isEqualTo(1);
        assertThat(pollRepository.findById(saved.getId())).isEmpty();
        assertThat(pollRepository.getVoteCounts(saved.getId())).isEmpty();
    }

    @Test
    public void deleteIsScopedToWorkspace() {
        Poll saved = pollRepository.save(poll(UUID.randomUUID().toString(), "Protected poll"));

        int deleted = pollRepository.deleteByIdAndWorkspaceGuid(saved.getId(), UUID.randomUUID().toString());

        assertThat(deleted).isZero();
        assertThat(pollRepository.findById(saved.getId())).isPresent();
    }

    @Test
    public void voteForUnknownAnswerIsIgnored() {
        Poll saved = pollRepository.save(poll(UUID.randomUUID().toString(), "Strict poll"));

        pollRepository.saveVote(saved.getId(), 99);

        assertThat(pollRepository.getVoteCounts(saved.getId())).isEqualTo(Map.of(1, 0, 2, 0));
    }
}
