package cz.scrumdojo.quizmaster.poll;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class Poll {

    private Integer id;
    private String workspaceGuid;
    private String question;
    private String[] answers;
}
