package cz.scrumdojo.quizmaster.quiz;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuizRepository extends JpaRepository<Quiz, Integer> {
    List<Quiz> findByWorkspaceGuidOrderByIdDesc(String workspaceGuid);

    org.springframework.data.domain.Page<Quiz> findByWorkspaceGuidOrderByIdDesc(
        String workspaceGuid,
        org.springframework.data.domain.Pageable pageable
    );

    org.springframework.data.domain.Page<Quiz> findByWorkspaceGuidAndTitleContainingIgnoreCaseOrderByIdDesc(
        String workspaceGuid,
        String query,
        org.springframework.data.domain.Pageable pageable
    );

    Optional<Quiz> findByIdAndWorkspaceGuid(Integer id, String workspaceGuid);

    @Query(value = "SELECT COUNT(*) > 0 FROM quiz WHERE ? = ANY(questions)", nativeQuery = true)
    boolean existsQuizWithQuestionId(int questionId);

    @Query(value = "SELECT DISTINCT unnest(questions) FROM quiz WHERE workspace_guid = ?", nativeQuery = true)
    Set<Integer> findQuestionIdsInQuizzesByWorkspaceGuid(String workspaceGuid);

    @Query(
        value = "SELECT title FROM quiz WHERE workspace_guid = ? AND ? = ANY(questions) ORDER BY id DESC",
        nativeQuery = true
    )
    List<String> findQuizTitlesByWorkspaceGuidAndQuestionId(String workspaceGuid, int questionId);

    @Modifying
    @Query("DELETE FROM Quiz q WHERE q.id = :id AND q.workspaceGuid = :workspaceGuid")
    int deleteByIdAndWorkspaceGuid(@Param("id") Integer id, @Param("workspaceGuid") String workspaceGuid);
}
