package cz.scrumdojo.quizmaster.question;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestionRepository extends JpaRepository<Question, Integer> {
    List<Question> findByWorkspaceGuidOrderByIdDesc(String guid);

    org.springframework.data.domain.Page<Question> findByWorkspaceGuidOrderByIdDesc(
        String guid,
        org.springframework.data.domain.Pageable pageable
    );

    org.springframework.data.domain.Page<Question> findByWorkspaceGuidAndQuestionContainingIgnoreCaseOrderByIdDesc(
        String workspaceGuid,
        String query,
        org.springframework.data.domain.Pageable pageable
    );

    Optional<Question> findByIdAndWorkspaceGuid(Integer id, String workspaceGuid);

    long countByIdInAndWorkspaceGuid(Collection<Integer> ids, String workspaceGuid);

    @Modifying
    @Query("DELETE FROM Question q WHERE q.id = :id AND q.workspaceGuid = :workspaceGuid")
    int deleteByIdAndWorkspaceGuid(@Param("id") Integer id, @Param("workspaceGuid") String workspaceGuid);
}
