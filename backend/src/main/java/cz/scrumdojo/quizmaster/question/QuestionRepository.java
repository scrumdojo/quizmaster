package cz.scrumdojo.quizmaster.question;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestionRepository extends JpaRepository<Question, Integer> {
    List<Question> findByWorkspaceGuidOrderByIdDesc(String guid);

    Page<Question> findByWorkspaceGuidOrderByIdDesc(String guid, Pageable pageable);

    @Query(
        value = """
        SELECT *
        FROM question q
        WHERE q.workspace_guid = :workspaceGuid
          AND (
                lower(q.question) LIKE lower(concat('%', :query, '%'))
                OR EXISTS (
                    SELECT 1
                    FROM unnest(coalesce(q.tags, ARRAY[]::text[])) AS tag
                    WHERE lower(tag) LIKE lower(concat('%', :query, '%'))
                )
          )
        ORDER BY q.id DESC
        """,
        countQuery = """
        SELECT count(*)
        FROM question q
        WHERE q.workspace_guid = :workspaceGuid
          AND (
                lower(q.question) LIKE lower(concat('%', :query, '%'))
                OR EXISTS (
                    SELECT 1
                    FROM unnest(coalesce(q.tags, ARRAY[]::text[])) AS tag
                    WHERE lower(tag) LIKE lower(concat('%', :query, '%'))
                )
          )
        """,
        nativeQuery = true
    )
    Page<Question> searchByWorkspaceGuidAndQuestionOrTagContainingIgnoreCase(
        @Param("workspaceGuid") String workspaceGuid,
        @Param("query") String query,
        Pageable pageable
    );

    Optional<Question> findByIdAndWorkspaceGuid(Integer id, String workspaceGuid);

    long countByIdInAndWorkspaceGuid(Collection<Integer> ids, String workspaceGuid);

    @Modifying
    @Query("DELETE FROM Question q WHERE q.id = :id AND q.workspaceGuid = :workspaceGuid")
    int deleteByIdAndWorkspaceGuid(@Param("id") Integer id, @Param("workspaceGuid") String workspaceGuid);
}
