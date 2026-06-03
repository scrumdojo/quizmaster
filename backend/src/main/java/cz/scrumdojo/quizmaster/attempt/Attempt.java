package cz.scrumdojo.quizmaster.attempt;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Duration;
import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "quiz_id", nullable = false)
    private Integer quizId;

    @Column(name = "cohort_guid")
    private String cohortGuid;

    @Column(name = "nickname")
    private String nickname;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "timed_out_at")
    private LocalDateTime timedOutAt;

    @Builder.Default
    @Column(name = "is_dry_run", nullable = false)
    private Boolean isDryRun = false;

    public AttemptStatus status() {
        if (isFinished() && !isTimedOut()) return AttemptStatus.FINISHED;
        if (isFinished() && isTimedOut()) return AttemptStatus.TIMEOUT;
        if (!isFinished() && isTimedOut()) return AttemptStatus.ABANDONED;
        return AttemptStatus.IN_PROGRESS;
    }

    public boolean isFinished() {
        return finishedAt != null;
    }

    public boolean isTimedOut() {
        return timedOutAt != null;
    }

    public void markFinished(LocalDateTime when) {
        this.finishedAt = when;
    }

    public void markTimedOut(LocalDateTime when) {
        this.timedOutAt = when;
    }

    public Integer durationSeconds(Integer timeLimitCap) {
        LocalDateTime endTime = timedOutAt != null ? timedOutAt : finishedAt;
        if (endTime == null) return null;
        int seconds = (int) Duration.between(startedAt, endTime).getSeconds();
        return (timedOutAt != null && timeLimitCap != null) ? Math.min(seconds, timeLimitCap) : seconds;
    }
}
