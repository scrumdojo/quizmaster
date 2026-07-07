package cz.scrumdojo.quizmaster.workspace;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class Workspace {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String guid;

    private String title;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
