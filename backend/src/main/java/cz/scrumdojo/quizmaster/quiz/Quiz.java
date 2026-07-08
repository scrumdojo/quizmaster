package cz.scrumdojo.quizmaster.quiz;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String title;
    private String description;
    private LocalDateTime startAt;
    private LocalDateTime endAt;

    public boolean isAvailable(LocalDateTime now) {
        return (startAt == null || !now.isBefore(startAt)) && (endAt == null || !now.isAfter(endAt));
    }

    @Column(name = "questions", columnDefinition = "int[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private int[] questionIds;

    @Column(name = "question_weights", columnDefinition = "int[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private int[] questionWeights;

    public int weightForQuestion(int questionId) {
        if (questionIds == null || questionWeights == null) return 1;
        for (int i = 0; i < questionIds.length; i++) {
            if (questionIds[i] == questionId) {
                return (i < questionWeights.length) ? questionWeights[i] : 1;
            }
        }
        return 1;
    }

    @Column(name = "question_released", columnDefinition = "boolean[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private boolean[] questionReleased;

    public boolean isReleased(int questionId) {
        if (questionIds == null || questionReleased == null) return false;
        for (int i = 0; i < questionIds.length; i++) {
            if (questionIds[i] == questionId) {
                return i < questionReleased.length && questionReleased[i];
            }
        }
        return false;
    }

    @Enumerated(EnumType.STRING)
    private QuizMode mode;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false)
    private Difficulty difficulty = Difficulty.KEEP_QUESTION;

    private int passScore;
    private Integer timeLimit; // time limit in seconds, null means no limit

    @Column(nullable = true)
    private String workspaceGuid; // Workspace GUID

    @Column(name = "random_question_count")
    private Integer randomQuestionCount;

    @Builder.Default
    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Cohort> cohorts = new ArrayList<>();

    public void setCohorts(List<Cohort> cohorts) {
        this.cohorts = cohorts == null ? new ArrayList<>() : new ArrayList<>(cohorts);
        syncCohortOwnership();
    }

    @PrePersist
    @PreUpdate
    private void syncCohortOwnership() {
        if (cohorts == null) {
            cohorts = new ArrayList<>();
            return;
        }
        cohorts.forEach(cohort -> cohort.setQuiz(this));
    }

    public int drawnQuestionCount() {
        int total = questionIds == null ? 0 : questionIds.length;
        return (randomQuestionCount != null && randomQuestionCount > 0) ? Math.min(randomQuestionCount, total) : total;
    }

    public boolean hasQuestion(Integer questionId) {
        if (questionIds == null || questionId == null) return false;
        for (int id : questionIds) {
            if (id == questionId) return true;
        }
        return false;
    }
}
