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
            .answers(List.of(new PollAnswer(1, "Weekly"), new PollAnswer(2, "Monthly")))
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
        assertThat(found.get().getAnswers()).containsExactly(new PollAnswer(1, "Weekly"), new PollAnswer(2, "Monthly"));
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
    public void voteForUnknownAnswerIsIgnored() {
        Poll saved = pollRepository.save(poll(UUID.randomUUID().toString(), "Strict poll"));

        pollRepository.saveVote(saved.getId(), 99);

        assertThat(pollRepository.getVoteCounts(saved.getId())).isEqualTo(Map.of(1, 0, 2, 0));
    }
}
