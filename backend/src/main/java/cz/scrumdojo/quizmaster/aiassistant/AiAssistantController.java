package cz.scrumdojo.quizmaster.aiassistant;

import cz.scrumdojo.quizmaster.question.QuestionResponse;
import cz.scrumdojo.quizmaster.workspace.WorkspaceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/workspaces/{workspaceGuid}/ai-assistant")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;
    private final WorkspaceRepository workspaceRepository;

    public AiAssistantController(AiAssistantService aiAssistantService, WorkspaceRepository workspaceRepository) {
        this.aiAssistantService = aiAssistantService;
        this.workspaceRepository = workspaceRepository;
    }

    @PostMapping
    public ResponseEntity<QuestionResponse> generate(
        @PathVariable String workspaceGuid,
        @RequestBody AiAssistantRequest request
    ) {
        requireWorkspaceExists(workspaceGuid);
        return ResponseEntity.ok(
            aiAssistantService.generateQuestion(
                request.question(),
                request.questionType(),
                workspaceGuid,
                request.excludedQuestionId()
            )
        );
    }

    @PostMapping("/chat")
    public ResponseEntity<RobinChatResponse> chat(
        @PathVariable String workspaceGuid,
        @RequestBody RobinChatRequest request
    ) {
        requireWorkspaceExists(workspaceGuid);
        return ResponseEntity.ok(
            aiAssistantService.chat(request.messages(), workspaceGuid, request.excludedQuestionId())
        );
    }

    @PostMapping("/batch")
    public ResponseEntity<QuestionResponse[]> generateBatch(
        @PathVariable String workspaceGuid,
        @RequestBody AiAssistantRequest request
    ) {
        requireWorkspaceExists(workspaceGuid);
        return ResponseEntity.ok(
            aiAssistantService.generateQuestions(request.question(), request.questionType(), workspaceGuid)
        );
    }

    private void requireWorkspaceExists(String workspaceGuid) {
        if (!workspaceRepository.existsById(workspaceGuid)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }
}
