package cz.scrumdojo.quizmaster.poll;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface PollRepository {
    Poll save(Poll poll);

    Poll update(Poll poll);

    List<Poll> findByWorkspaceGuid(String workspaceGuid);

    Optional<Poll> findById(Integer id);

    Optional<Poll> findByIdAndWorkspaceGuid(Integer id, String workspaceGuid);

    int deleteByIdAndWorkspaceGuid(Integer id, String workspaceGuid);

    void saveVote(Integer pollId, Integer answerId);

    Map<Integer, Integer> getVoteCounts(Integer pollId);
}
