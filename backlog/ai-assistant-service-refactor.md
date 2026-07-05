# AI Assistant — embedding failure visibility

> Trimmed 2026-07-05: the original overload-sprawl and prompt-assembly issues
> were resolved by the Robin unified-chat rewrite (one `chat(...)` entry point,
> one `robin-chat.md` prompt). What remains is the observability gap below.

## Issue: embedding failures are invisible

`QuestionEmbeddingService.embedBestEffort` catches every `RuntimeException`, clears the
embedding columns, and continues. Operationally this means a misconfigured token,
a 5xx from OpenRouter, or a JSON shape change all degrade dedup to "no comparison" with
no log line and no signal to the user. The same pattern exists in
`AiAssistantService.findChatDuplicate` (catching `RuntimeException` to `return null`).

## Approach

- `embedBestEffort` should `WARN` log with workspace + question id and the embedding model.
- Promote the result to a structured signal: `IdResponse` becomes
  `IdResponse(id, embeddingStatus)` (or wrap it). FE can then show "AI dedup unavailable"
  the next time Robin opens for that workspace.
- `findChatDuplicate` catching `RuntimeException` is acceptable
  (we'd rather not block generation), but it should also `WARN` so silent degradation is
  observable in logs.

## Files in scope

- `backend/src/main/java/cz/scrumdojo/quizmaster/aiassistant/AiAssistantService.java`
- `backend/src/main/java/cz/scrumdojo/quizmaster/aiassistant/QuestionEmbeddingService.java`
  (`embedBestEffort`)
- `backend/src/main/java/cz/scrumdojo/quizmaster/common/IdResponse.java` (if extending)
