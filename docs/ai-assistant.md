# AI Assistant

Quizmaster has two AI-assisted flows, both built on the same shape (frontend
transcript, stateless backend endpoint, one system prompt, OpenRouter as the
LLM provider): **Robin AI** generates question drafts on demand for
[Quiz makers](domain-language.md#roles), and the **explanation chat** lets
[Quiz takers](domain-language.md#roles) ask free-form follow-up questions
under a question's explanation. Most of this document describes Robin, since
the explanation chat only deviates from it in a few places — see
[The explanation chat is Robin's shape, for the taker instead of the maker](#the-explanation-chat-is-robins-shape-for-the-taker-instead-of-the-maker).

For the user-facing behavior, see [domain-language.md](domain-language.md#ai-assistance-robin-ai)
and [domain-language.md](domain-language.md#explanation-chat).
This document covers the architectural decisions worth knowing before changing
the code.

## One conversation, one endpoint, one prompt

Robin is a multi-turn chat over a single endpoint,
`POST /api/workspaces/{guid}/ai-assistant/chat`, driven by **one** unified
system prompt (`backend/src/main/resources/prompts/robin-chat.md`). The model
infers each question's type (single / multiple / numerical) from the maker's
natural language, so there is no type parameter anywhere in the pipeline and
one turn can return a mix of types.

The **frontend owns the transcript** and sends the whole conversation on every
call; the **backend stays stateless** between calls. Assistant turns in the
request carry the structured prior drafts, and the backend re-serializes them
as the canonical `{"questions": [...]}` JSON before replaying the conversation
to OpenRouter — the model always sees its own prior output in schema-perfect
form, which is the main reliability lever for refinement. The transcript is
ephemeral; closing the sheet discards it.

Editing a question is not special on the wire: the frontend seeds the
conversation with a synthetic opening pair (a user turn plus an assistant turn
containing the existing question as the first draft version) and passes
`excludedQuestionId` so dedup ignores the question being edited. The
preserve-untouched-fields rule lives in the unified prompt.

Each response turn returns `{ drafts, notice? }`. Drafts carry `isEasy`/`tags`
only when the model actually produced them — the chat DTO
(`aiassistant/QuestionDraft.java`) never fabricates defaults.

## Robin AI is decoupled from forms via `RobinFormBinding`

Robin runs on top of two different surfaces — the per-question form and the
workspace screen. To make that reuse possible, it never imports form
internals. The contract is:

```ts
RobinFormBinding { snapshot, applyPatch }
```

Robin reads current form state through `snapshot()` and writes drafts back
through `applyPatch(patch)`. New surfaces that want Robin only need to
implement that interface; Robin itself is unaware of which form it is editing.

If you find yourself reaching into form state from inside Robin, you are
probably violating this boundary.

## Duplicate avoidance is a filter plus a chat notice

The risk Robin solves for is generating a draft that already exists in the
workspace. The mechanism, applied per generated question on every turn:

1. Each saved question is embedded once and the vector is cached on the row.
2. A generated question is first compared by normalized **exact text** against
   every workspace question (this works even when embeddings are missing),
   then embedded and compared against every cached vector by cosine
   similarity.
3. A question that matches (exact, or above `ai.embedding.similarity-threshold`)
   is **filtered out of the drafts** and reported in the response `notice`;
   the remaining drafts still come back with HTTP 200.

There is deliberately no silent retry and no error status: in a conversation
the maker's next message *is* the retry, and the notice tells them why a draft
is missing. The system prompt additionally lists the embedded workspace
questions with an instruction to draft something different, so filtering is
the backstop, not the primary defense.

The cached embedding is invalidated whenever the embedding model or the
canonical question text changes, so swapping the model in configuration
forces re-embedding without manual intervention.

Embedding a saved question is a background OpenRouter round-trip, scheduled
after the write commits — but it still costs tokens on every question created
or updated. The question create/update endpoints therefore accept an optional
`X-Skip-Embedding: true` header that suppresses scheduling it. This is a test
affordance: E2E scenarios that don't exercise Robin send it so bulk question
setup spends no OpenRouter tokens. Production clients never send it, so the
default stays "embed" — and a question saved without an embedding is invisible
to embedding dedup (only the exact-text match can catch it) until it is
re-saved.

## OpenRouter is reached through two endpoints with one token

Drafting and embedding are different OpenRouter endpoints with different
model settings, but they share a single API token. There is no separate
embedding provider — keeping both behind OpenRouter avoids managing two
credentials.

Configuration lives under the `ai.*` namespace in `application.properties`
(token, chat-completion model, embedding model, similarity threshold,
max-tokens). See [devenv/how-to-develop.md](devenv/how-to-develop.md) for
how to set them up locally.

## The explanation chat is Robin's shape, for the taker instead of the maker

Takers can ask free-form follow-up questions under a question's explanation
(learning-mode quizzes and standalone questions alike — it triggers on
"an explanation is showing", not on `QuizMode.LEARN` specifically). The
feature reuses Robin's architecture almost unchanged: one stateless endpoint,
`POST /api/question/{id}/explanation-chat` (`ExplanationChatController`,
`question/` package), one system prompt
(`backend/src/main/resources/prompts/explanation-chat.md`), one
`ExplanationChatService` (`aiassistant/` package) that replays the
frontend-owned transcript to OpenRouter. There is no new database table — the
transcript lives only in frontend state (`use-explanation-chat.ts`) and is
discarded when the `ExplanationChat` component unmounts (collapsing does not
unmount it; answering again or starting a new attempt does).

The backend seeds the conversation itself: the request carries only
`questionId` (path) and the taker's `givenAnswer` (an index/value reference,
same shape as `QuestionAnswerRequest` for submit) — never the question text,
answer text, or explanation as free text from the client. `ExplanationChatService`
loads the `Question` by id and builds the opening context block from
`question.getQuestion()`, `describeGivenAnswer()` (branches on
`QuestionType` — numerical vs. index-based choice), and
`questionExplanation` (falls back to "No explanation provided." when blank,
so a question without an explanation still supports the chat).

The system prompt carries two behavioral constraints beyond "answer helpfully
using the context":

- **Topic boundary**: an off-topic follow-up is not answered on its own terms
  and does not end the conversation — the model names the quiz question's
  topic and steers back to it, leaving the conversation open for a later
  on-topic question.
- **Tone mirroring with a floor**: the model matches the taker's tone and
  language, except when the taker is rude or unfriendly — then it stays
  neutral and friendly rather than mirroring or escalating.

Both are prompt-only behaviors (no code branches), verified by `@ai`-tagged
specs in `specs/features/take/question/Question.Take.ExplanationChat.OffTopic.feature`
and `...Tone.feature` that assert against real model output.

Validation failures carry the same stable error codes as Robin
(`ai-token-not-configured`, `empty-chat-messages`, `invalid-last-message`, via
`CodedResponseStatusException`), and `use-explanation-chat.ts` maps them to a
clearer message the same way Robin's `errorMessageFor` does — an AI-call
failure surfaces as a visible error in the chat, never a silent no-op.

## MCP does not expose Robin

The MCP server deliberately has no AI drafting tool — an MCP client is itself
an AI and drafts questions directly. See [mcp/overview.md](mcp/overview.md).

## Where to look

- Frontend Robin lives under `frontend/src/make/create-question/robin-ai/`
  (`robin-sheet.tsx` renders the chat; `use-robin-prompt-form.ts` owns the
  transcript and draft versions). The workspace flavor reuses the same sheet
  from `frontend/src/make/workspace/workspace-robin-ai-helper.tsx`. The API
  call is in `frontend/src/make/api/ai-assistant.ts`.
- Backend lives under `backend/src/main/java/cz/scrumdojo/quizmaster/aiassistant/`.
  `AiAssistantService.chat` orchestrates the transcript replay, per-type
  validation, and dedup; the embedding stack is in the same package.
- The explanation chat's frontend lives under
  `frontend/src/take/question-take/` (`components/explanation-chat.tsx` renders
  the collapsible chat; `use-explanation-chat.ts` owns the transcript). The API
  call is in `frontend/src/take/api/question.ts`. Its backend service
  (`ExplanationChatService`) sits in `aiassistant/` alongside Robin's; its
  controller (`ExplanationChatController`) sits in `question/`.
