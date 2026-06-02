package cz.scrumdojo.quizmaster.poll;

import cz.scrumdojo.quizmaster.common.IdResponse;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.workspace.WorkspaceGuard;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workspaces/{workspaceGuid}/polls")
public class PollController {

    private final WorkspaceGuard workspaceGuard;
    private final PollRepository pollRepository;

    public PollController(WorkspaceGuard workspaceGuard, PollRepository pollRepository) {
        this.workspaceGuard = workspaceGuard;
        this.pollRepository = pollRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<PollResponse> getPoll(@PathVariable String workspaceGuid, @PathVariable Integer id) {
        workspaceGuard.requireExists(workspaceGuid);

        return ResponseHelper.okOrNotFound(
            pollRepository.findByIdAndWorkspaceGuid(id, workspaceGuid).map(PollResponse::from)
        );
    }

    @PostMapping
    public ResponseEntity<IdResponse> createPoll(
        @PathVariable String workspaceGuid,
        @Valid @RequestBody PollRequest request
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        Poll created = pollRepository.save(request.toEntity(workspaceGuid));
        return ResponseEntity.ok(new IdResponse(created.getId()));
    }
}
