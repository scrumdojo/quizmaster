package cz.scrumdojo.quizmaster.poll;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class PostgresPollRepository implements PollRepository {

    private static final String SELECT_POLL = "SELECT id, workspace_guid, question FROM poll";

    private final JdbcClient jdbc;

    public PostgresPollRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public Poll save(Poll poll) {
        Integer id = jdbc
            .sql("INSERT INTO poll (workspace_guid, question) VALUES (:workspaceGuid, :question) RETURNING id")
            .param("workspaceGuid", poll.getWorkspaceGuid())
            .param("question", poll.getQuestion())
            .query(Integer.class)
            .single();

        List<PollAnswer> answers = poll.getAnswers() == null ? List.of() : List.copyOf(poll.getAnswers());
        for (PollAnswer answer : answers) {
            insertAnswer(id, answer.id(), answer.text());
        }

        return poll.toBuilder().id(id).answers(answers).build();
    }

    @Override
    @Transactional
    public Poll update(Poll poll) {
        jdbc
            .sql("UPDATE poll SET question = :question WHERE id = :id")
            .param("question", poll.getQuestion())
            .param("id", poll.getId())
            .update();

        List<PollAnswer> answers = poll.getAnswers() == null ? List.of() : poll.getAnswers();
        int nextAnswerId = nextAnswerId(poll.getId());
        deleteRemovedAnswers(poll.getId(), answers);

        List<PollAnswer> saved = new ArrayList<>(answers.size());
        for (PollAnswer answer : answers) {
            if (answer.id() != null) {
                jdbc
                    .sql("UPDATE poll_answer SET text = :text WHERE poll_id = :pollId AND answer_id = :answerId")
                    .param("text", answer.text())
                    .param("pollId", poll.getId())
                    .param("answerId", answer.id())
                    .update();
                saved.add(answer);
            } else {
                insertAnswer(poll.getId(), nextAnswerId, answer.text());
                saved.add(new PollAnswer(nextAnswerId, answer.text()));
                nextAnswerId++;
            }
        }

        return poll.toBuilder().answers(List.copyOf(saved)).build();
    }

    private void insertAnswer(Integer pollId, Integer answerId, String text) {
        jdbc
            .sql("INSERT INTO poll_answer (poll_id, answer_id, text) VALUES (:pollId, :answerId, :text)")
            .param("pollId", pollId)
            .param("answerId", answerId)
            .param("text", text)
            .update();
    }

    private int nextAnswerId(Integer pollId) {
        return jdbc
            .sql("SELECT COALESCE(MAX(answer_id), 0) + 1 FROM poll_answer WHERE poll_id = :pollId")
            .param("pollId", pollId)
            .query(Integer.class)
            .single();
    }

    private void deleteRemovedAnswers(Integer pollId, List<PollAnswer> answers) {
        List<Integer> keptIds = answers.stream().map(PollAnswer::id).filter(Objects::nonNull).toList();
        if (keptIds.isEmpty()) {
            jdbc.sql("DELETE FROM poll_answer WHERE poll_id = :pollId").param("pollId", pollId).update();
            return;
        }

        jdbc
            .sql("DELETE FROM poll_answer WHERE poll_id = :pollId AND answer_id NOT IN (:keptIds)")
            .param("pollId", pollId)
            .param("keptIds", keptIds)
            .update();
    }

    @Override
    public List<Poll> findByWorkspaceGuid(String workspaceGuid) {
        return jdbc
            .sql(SELECT_POLL + " WHERE workspace_guid = :workspaceGuid ORDER BY id DESC")
            .param("workspaceGuid", workspaceGuid)
            .query(this::mapPoll)
            .list()
            .stream()
            .map(this::withAnswers)
            .toList();
    }

    @Override
    public Optional<Poll> findById(Integer id) {
        return jdbc
            .sql(SELECT_POLL + " WHERE id = :id")
            .param("id", id)
            .query(this::mapPoll)
            .optional()
            .map(this::withAnswers);
    }

    @Override
    public Optional<Poll> findByIdAndWorkspaceGuid(Integer id, String workspaceGuid) {
        return jdbc
            .sql(SELECT_POLL + " WHERE id = :id AND workspace_guid = :workspaceGuid")
            .param("id", id)
            .param("workspaceGuid", workspaceGuid)
            .query(this::mapPoll)
            .optional()
            .map(this::withAnswers);
    }

    @Override
    public void saveVote(Integer pollId, Integer answerId) {
        jdbc
            .sql("UPDATE poll_answer SET votes = votes + 1 WHERE poll_id = :pollId AND answer_id = :answerId")
            .param("pollId", pollId)
            .param("answerId", answerId)
            .update();
    }

    @Override
    public Map<Integer, Integer> getVoteCounts(Integer pollId) {
        return jdbc
            .sql("SELECT answer_id, votes FROM poll_answer WHERE poll_id = :pollId")
            .param("pollId", pollId)
            .query((rs, rowNum) -> Map.entry(rs.getInt("answer_id"), rs.getInt("votes")))
            .list()
            .stream()
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private Poll mapPoll(ResultSet rs, int rowNum) throws SQLException {
        return Poll.builder()
            .id(rs.getInt("id"))
            .workspaceGuid(rs.getString("workspace_guid"))
            .question(rs.getString("question"))
            .build();
    }

    private Poll withAnswers(Poll poll) {
        List<PollAnswer> answers = jdbc
            .sql("SELECT answer_id, text FROM poll_answer WHERE poll_id = :pollId ORDER BY answer_id")
            .param("pollId", poll.getId())
            .query((rs, rowNum) -> new PollAnswer(rs.getInt("answer_id"), rs.getString("text")))
            .list();
        return poll.toBuilder().answers(answers).build();
    }
}
