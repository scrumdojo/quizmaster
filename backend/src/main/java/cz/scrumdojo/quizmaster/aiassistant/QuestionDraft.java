package cz.scrumdojo.quizmaster.aiassistant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import cz.scrumdojo.quizmaster.question.QuestionType;

// A question draft on the Robin chat wire, in both directions: assistant turns in the
// request transcript and generated drafts in the response. Unlike QuestionResponse it
// never fabricates isEasy/tags — they stay absent unless the model produced them.
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record QuestionDraft(
    String question,
    QuestionType questionType,
    String[] answers,
    int[] correctAnswers,
    String[] explanations,
    String questionExplanation,
    Double tolerance,
    Boolean isEasy,
    String[] tags
) {}
