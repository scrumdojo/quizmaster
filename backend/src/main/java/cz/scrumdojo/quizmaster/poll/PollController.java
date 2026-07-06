package cz.scrumdojo.quizmaster.poll;

import cz.scrumdojo.quizmaster.common.IdResponse;
import cz.scrumdojo.quizmaster.common.ResponseHelper;
import cz.scrumdojo.quizmaster.workspace.WorkspaceGuard;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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

    @GetMapping
    public ResponseEntity<List<PollListResponse>> getPolls(@PathVariable String workspaceGuid) {
        workspaceGuard.requireExists(workspaceGuid);

        var polls = pollRepository.findByWorkspaceGuid(workspaceGuid).stream().map(PollListResponse::from).toList();
        return ResponseEntity.ok(polls);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PollResponse> getPoll(@PathVariable String workspaceGuid, @PathVariable Integer id) {
        workspaceGuard.requireExists(workspaceGuid);

        return ResponseHelper.okOrNotFound(
            pollRepository.findByIdAndWorkspaceGuid(id, workspaceGuid).map(PollResponse::from)
        );
    }

    @GetMapping("/{id}/results")
    public ResponseEntity<PollResultsResponse> getPollResults(
        @PathVariable String workspaceGuid,
        @PathVariable Integer id
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        return ResponseHelper.okOrNotFound(
            pollRepository.findByIdAndWorkspaceGuid(id, workspaceGuid).map(this::toPollResultsResponse)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<IdResponse> updatePoll(
        @PathVariable String workspaceGuid,
        @PathVariable Integer id,
        @Valid @RequestBody PollUpdateRequest request
    ) {
        workspaceGuard.requireExists(workspaceGuid);

        return ResponseHelper.okOrNotFound(
            pollRepository
                .findByIdAndWorkspaceGuid(id, workspaceGuid)
                .map(poll -> pollRepository.update(request.toEntity(poll.getId(), workspaceGuid)))
                .map(updated -> new IdResponse(updated.getId()))
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePoll(@PathVariable String workspaceGuid, @PathVariable Integer id) {
        workspaceGuard.requireExists(workspaceGuid);

        int deleted = pollRepository.deleteByIdAndWorkspaceGuid(id, workspaceGuid);
        return deleted > 0 ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
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

    private PollResultsResponse toPollResultsResponse(Poll poll) {
        Map<Integer, Integer> voteCounts = pollRepository.getVoteCounts(poll.getId());
        var results = poll
            .getAnswers()
            .stream()
            .map(answer ->
                new PollResultsResponse.PollResultItem(
                    answer.id(),
                    answer.text(),
                    voteCounts.getOrDefault(answer.id(), 0)
                )
            )
            .toList();
        return new PollResultsResponse(poll.getId(), results);
    }
}
