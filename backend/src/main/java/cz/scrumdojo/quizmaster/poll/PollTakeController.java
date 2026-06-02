package cz.scrumdojo.quizmaster.poll;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/poll")
public class PollTakeController {

    private final PollRepository pollRepository;

    public PollTakeController(PollRepository pollRepository) {
        this.pollRepository = pollRepository;
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Void> submitVote(@PathVariable Integer id, @Valid @RequestBody PollVoteRequest request) {
        return pollRepository
            .findById(id)
            .map(poll -> submitVote(poll, request.selectedAnswerId()))
            .orElse(ResponseEntity.notFound().build());
    }

    private ResponseEntity<Void> submitVote(Poll poll, Integer selectedAnswerId) {
        boolean answerExists = poll
            .getAnswers()
            .stream()
            .anyMatch(answer -> answer.id().equals(selectedAnswerId));
        if (!answerExists) {
            return ResponseEntity.badRequest().build();
        }

        pollRepository.saveVote(poll.getId(), selectedAnswerId);
        return ResponseEntity.noContent().build();
    }
}
