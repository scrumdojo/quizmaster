package cz.scrumdojo.quizmaster.workspace;

import cz.scrumdojo.quizmaster.common.ResponseHelper;
import jakarta.validation.Valid;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private final WorkspaceRepository workspaceRepository;
    private final Clock clock;

    public WorkspaceController(WorkspaceRepository workspaceRepository, Clock clock) {
        this.workspaceRepository = workspaceRepository;
        this.clock = clock;
    }

    @PostMapping
    public ResponseEntity<WorkspaceCreateResponse> saveWorkspace(@Valid @RequestBody WorkspaceRequest request) {
        var createdWorkspace = workspaceRepository.save(request.toEntity(LocalDateTime.now(clock)));
        return ResponseEntity.ok(new WorkspaceCreateResponse(createdWorkspace.getGuid()));
    }

    @GetMapping
    public List<WorkspaceResponse> getAllWorkspaces(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDateTime fromDateTime = from == null ? null : from.atStartOfDay();
        LocalDateTime toDateTime = to == null ? null : to.atTime(LocalTime.MAX);
        return workspaceRepository
            .findAllWithQuestionsOrderByCreatedAtDesc()
            .stream()
            .filter(w -> fromDateTime == null || !w.getCreatedAt().isBefore(fromDateTime))
            .filter(w -> toDateTime == null || !w.getCreatedAt().isAfter(toDateTime))
            .map(WorkspaceResponse::from)
            .toList();
    }

    @GetMapping("/{workspaceGuid}")
    public ResponseEntity<WorkspaceResponse> getWorkspace(@PathVariable String workspaceGuid) {
        return ResponseHelper.okOrNotFound(workspaceRepository.findById(workspaceGuid).map(WorkspaceResponse::from));
    }
}
