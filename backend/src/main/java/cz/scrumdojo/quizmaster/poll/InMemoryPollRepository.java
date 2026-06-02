package cz.scrumdojo.quizmaster.poll;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryPollRepository implements PollRepository {

    private final AtomicInteger idSequence = new AtomicInteger(0);
    private final Map<Integer, Poll> polls = new ConcurrentHashMap<>();
    private final Map<Integer, Map<Integer, AtomicInteger>> votesByPollId = new ConcurrentHashMap<>();

    @Override
    public Poll save(Poll poll) {
        int id = idSequence.incrementAndGet();
        Poll saved = poll.toBuilder().id(id).answers(copyAnswers(poll.getAnswers())).build();
        polls.put(id, saved);
        votesByPollId.put(id, createVoteCounters(saved.getAnswers()));
        return saved;
    }

    @Override
    public Optional<Poll> findById(Integer id) {
        return Optional.ofNullable(polls.get(id));
    }

    @Override
    public Optional<Poll> findByIdAndWorkspaceGuid(Integer id, String workspaceGuid) {
        return findById(id).filter(p -> workspaceGuid.equals(p.getWorkspaceGuid()));
    }

    @Override
    public void saveVote(Integer pollId, Integer answerId) {
        var voteCounters = votesByPollId.get(pollId);
        if (voteCounters == null) {
            return;
        }

        AtomicInteger voteCounter = voteCounters.get(answerId);
        if (voteCounter != null) {
            voteCounter.incrementAndGet();
        }
    }

    @Override
    public Map<Integer, Integer> getVoteCounts(Integer pollId) {
        var voteCounters = votesByPollId.get(pollId);
        if (voteCounters == null) {
            return Map.of();
        }

        Map<Integer, Integer> snapshot = new HashMap<>();
        for (var entry : voteCounters.entrySet()) {
            snapshot.put(entry.getKey(), entry.getValue().get());
        }

        return Map.copyOf(snapshot);
    }

    private Map<Integer, AtomicInteger> createVoteCounters(List<PollAnswer> answers) {
        Map<Integer, AtomicInteger> voteCounters = new HashMap<>();
        if (answers == null) {
            return voteCounters;
        }

        for (PollAnswer answer : answers) {
            voteCounters.put(answer.id(), new AtomicInteger(0));
        }

        return voteCounters;
    }

    private List<PollAnswer> copyAnswers(List<PollAnswer> answers) {
        return answers == null ? List.of() : List.copyOf(answers);
    }
}
