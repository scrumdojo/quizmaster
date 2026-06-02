package cz.scrumdojo.quizmaster.attempt;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttemptRepository extends JpaRepository<Attempt, Integer> {
    Optional<Attempt> findByIdAndQuizId(Integer id, Integer quizId);
    List<Attempt> findByQuizIdAndIsDryRunFalseOrderByStartedAtDesc(Integer quizId);
    boolean existsByQuizIdAndCohortGuid(Integer quizId, String cohortGuid);
}
