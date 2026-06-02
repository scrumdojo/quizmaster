package cz.scrumdojo.quizmaster.poll;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryPollRepository implements PollRepository {

    private final AtomicInteger idSequence = new AtomicInteger(0);
    private final Map<Integer, Poll> polls = new ConcurrentHashMap<>();

    @Override
    public Poll save(Poll poll) {
        int id = idSequence.incrementAndGet();
        Poll saved = poll.toBuilder().id(id).answers(copyAnswers(poll.getAnswers())).build();
        polls.put(id, saved);
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

    private String[] copyAnswers(String[] answers) {
        return answers == null ? null : answers.clone();
    }
}
