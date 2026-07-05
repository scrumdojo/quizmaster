# AI Assistant

Quizmaster generates question drafts on demand for [Quiz makers](domain-language.md#roles).
The feature has three pieces: **Robin AI** in the frontend (the FAB and chat
sheet the maker interacts with), an AI assistant service in the backend, and
**OpenRouter** as the external LLM provider.

For the user-facing behavior, see [domain-language.md](domain-language.md#ai-assistance-robin-ai).
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
