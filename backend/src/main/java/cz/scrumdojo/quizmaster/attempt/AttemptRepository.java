package cz.scrumdojo.quizmaster.attempt;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AttemptRepository extends JpaRepository<Attempt, Integer> {
    Optional<Attempt> findByIdAndQuizId(Integer id, Integer quizId);
    List<Attempt> findByQuizIdAndIsDryRunFalseOrderByStartedAtDesc(Integer quizId);
    List<Attempt> findByQuizIdAndIsDryRunFalseOrderByStartedAtAscIdAsc(Integer quizId);
    boolean existsByQuizIdAndCohortGuid(Integer quizId, String cohortGuid);

    @Query(
        """
        select a from Attempt a
        where a.quizId = :quizId
          and a.id <> :excludeAttemptId
          and a.finishedAt is not null
          and ((:nickname is null and a.nickname is null) or a.nickname = :nickname)
          and ((:cohortGuid is null and a.cohortGuid is null) or a.cohortGuid = :cohortGuid)
        """
    )
    List<Attempt> findEarlierFinishedAttempts(
        @Param("quizId") Integer quizId,
        @Param("nickname") String nickname,
        @Param("cohortGuid") String cohortGuid,
        @Param("excludeAttemptId") Integer excludeAttemptId
    );

    @Query(
        """
        select a from Attempt a
        where a.quizId = :quizId
          and a.finishedAt is not null
          and ((:nickname is null and a.nickname is null) or a.nickname = :nickname)
          and ((:cohortGuid is null and a.cohortGuid is null) or a.cohortGuid = :cohortGuid)
        """
    )
    List<Attempt> findFinishedAttempts(
        @Param("quizId") Integer quizId,
        @Param("nickname") String nickname,
        @Param("cohortGuid") String cohortGuid
    );
}
