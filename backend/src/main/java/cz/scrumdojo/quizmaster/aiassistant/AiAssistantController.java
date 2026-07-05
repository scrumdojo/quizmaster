package cz.scrumdojo.quizmaster.aiassistant;

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

    private void requireWorkspaceExists(String workspaceGuid) {
        if (!workspaceRepository.existsById(workspaceGuid)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }
}
