package cz.scrumdojo.quizmaster.poll;

import java.util.Optional;

public interface PollRepository {
    Poll save(Poll poll);

    Optional<Poll> findById(Integer id);

    Optional<Poll> findByIdAndWorkspaceGuid(Integer id, String workspaceGuid);
}
