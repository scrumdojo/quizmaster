package cz.scrumdojo.quizmaster.question;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
@Entity
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String question;

    @Column(name = "question_type")
    private QuestionType questionType;

    @Column(name = "answers", columnDefinition = "text[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private String[] answers;

    @Column(name = "explanations", columnDefinition = "text[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private String[] explanations;

    private String questionExplanation;

    @Column(name = "correct_answers", columnDefinition = "text[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private int[] correctAnswers;

    @Column(name = "workspace_guid", columnDefinition = "varchar(36)")
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private String workspaceGuid;

    @Column(name = "is_easy", columnDefinition = "boolean")
    @JdbcTypeCode(SqlTypes.BOOLEAN)
    private boolean isEasy;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "tolerance", nullable = false)
    private double tolerance;

    @Column(name = "tags", columnDefinition = "text[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private String[] tags;

    @Column(name = "embedding", columnDefinition = "double precision[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private double[] embedding;

    @Column(name = "embedding_model")
    private String embeddingModel;

    @Column(name = "embedding_text_hash")
    private String embeddingTextHash;
}
