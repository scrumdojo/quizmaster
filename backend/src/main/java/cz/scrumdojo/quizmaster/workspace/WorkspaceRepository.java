package cz.scrumdojo.quizmaster.workspace;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface WorkspaceRepository extends JpaRepository<Workspace, String> {
    // Only workspaces with at least one question are worth surfacing on the home page's
    // "jump back in" list. The optional from/to date range is filtered in Java afterwards.
    @Query(
        "SELECT w FROM Workspace w WHERE EXISTS (SELECT 1 FROM Question q WHERE q.workspaceGuid = w.guid) " +
            "ORDER BY w.createdAt DESC"
    )
    List<Workspace> findAllWithQuestionsOrderByCreatedAtDesc();
}
