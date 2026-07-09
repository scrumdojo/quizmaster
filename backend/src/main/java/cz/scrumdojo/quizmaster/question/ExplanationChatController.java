package cz.scrumdojo.quizmaster.question;

import cz.scrumdojo.quizmaster.aiassistant.ExplanationChatRequest;
import cz.scrumdojo.quizmaster.aiassistant.ExplanationChatResponse;
import cz.scrumdojo.quizmaster.aiassistant.ExplanationChatService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/question/{id}/explanation-chat")
public class ExplanationChatController {

    private final ExplanationChatService explanationChatService;
    private final QuestionRepository questionRepository;

    public ExplanationChatController(
        ExplanationChatService explanationChatService,
        QuestionRepository questionRepository
    ) {
        this.explanationChatService = explanationChatService;
        this.questionRepository = questionRepository;
    }

    @PostMapping
    public ResponseEntity<ExplanationChatResponse> chat(
        @PathVariable Integer id,
        @RequestBody ExplanationChatRequest request
    ) {
        Question question = questionRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(explanationChatService.chat(question, request.givenAnswer(), request.messages()));
    }
}
