# Robin AI → Unified Conversational Chat (baby-step rewrite)

> Supersedes `ai-assistant-refactor.md`: that plan kept Robin stateless and only
> unified the prompt. This plan adds the multi-turn conversation axis the product
> now wants, and sequences the whole thing as scenario-driven baby steps.

## Context

Robin AI today is shaped around `(questionType × single|batch)`: six backend prompt
files selected by a type switch, two endpoints (`/ai-assistant` + `/ai-assistant/batch`),
a question-type radio in the UI, and a **frontend-built English prompt wrapper** that
JSON-stringifies the current question for edits (`buildEditAiPrompt`/`typeInstructionFor`
in `robin-ai-helper.tsx`). The "chat" shell that landed recently is not really
conversational — each generation **replaces** the draft list and the backend never sees
prior turns. Editing is unreliable and unintuitive. Many E2E specs are tagged `@ai` but
actually **stubbed** via `page.route` interception, so they test FE wiring while
masquerading as real-LLM tests.

**Target end state:**
- One **unified multi-turn chat**. In a single conversation the maker asks for any number
  of questions of any type (single / multiple / numerical), mixed. The model **infers type
  from natural language** — no type selector in the UI.
- **Frontend owns the transcript** and sends the whole conversation on every call; the
  **backend stays stateless**. Transcript is ephemeral (lost on close/refresh).
- A turn returns **drafts only**; a **duplicate rejection** surfaces as a Robin chat
  message (not a hard error), so the maker can continue.
- **Refine = a new draft version appended**; all prior versions stay visible and each is
  independently usable. The model preserves every field not asked to change.
- **No system-prompt fragment in the frontend.** **One** unified backend system prompt.
- Terminal actions: create/edit form → "Use this" transfers the chosen version into the
  form; edit additionally **preloads the existing question as the first draft**. Workspace
  → **Save individual** + **Save all**.
- Chat cards show **per-answer explanations AND the per-question explanation**, plus
  numerical answer + tolerance; `tags`/`isEasy` only if the model produced them.
- **MCP must not expose AI at all** — remove the draft tool (separate commit).
- **No stubbed scenarios.** Every Robin scenario is a real `@ai` spec that also verifies
  the system prompt's reliability. Drop pointless negative-layout scenarios.

**Out of scope:** embedding-failure observability (`ai-assistant-service-refactor.md`),
streaming, transcript persistence.

## Approach & sequencing

Build the shared conversational engine on the **create-question form** (leanest terminal
action), then **edit** (= create + a preloaded first draft), then **workspace** (= same
chat + save). Add a **new endpoint path** so old and new coexist during migration; delete
each legacy piece **in the same commit** its replacement lands. Never leave two prompt
systems half-wired across more than one commit. Author the **full scenario suite up front**
as `@skip @ai`, then unskip one (or a tiny batch) per commit.

**Execution order: C0 → C1 → C2 → C3 → C7 → C4 → C5 → C6 → C8.** C7 (MCP removal) runs
before C4 because the MCP client calls `/ai-assistant`, which C4 deletes (Risk 2).

Two constraints pin deletions to specific commits (2026-07-05 review):

- **Stubs stop matching the moment a surface migrates.** The `page.route('**/ai-assistant')`
  stub does not intercept `/ai-assistant/chat`, so stub-driven scenarios for a surface die
  in the commit that migrates that surface — **create-form stubs in C1** (not C3), edit
  stubs in C3, workspace stubs in C4.
- **playwright-bdd (`bddgen`) fails generation on undefined steps even for `@skip`
  scenarios.** A step definition can only be deleted in the commit that removes the last
  feature-file reference to it. The type radio lives in the shared `RobinSheet` and the
  workspace's legacy `/batch` path still needs `questionType` until C4 — so the radio, the
  `askFor*` page-object methods, the `I ask AI for (type) question(s):` steps, and the
  numerical-feature rewrite all land together in **C4** (not C3/C5).

Pre-commit gate, every commit: `pnpm code && pnpm test:be:local && pnpm test:e2e`
(`@ai` scenarios skip without `OPENROUTER_API_KEY`; flag skipped ones in the PR).

### Endpoint contract (new, additive)

`POST /api/workspaces/{guid}/ai-assistant/chat` — a new path so the legacy `**/ai-assistant`
stub stops intercepting and old/new can coexist.

Request — FE transmits the whole transcript; assistant turns carry **structured prior
drafts** (FE already holds these), not raw LLM JSON:
```jsonc
{
  "messages": [
    { "role": "user", "content": "Ask two questions about Czech geography, one numerical" },
    { "role": "assistant", "drafts": [ <QuestionDraft>, <QuestionDraft> ] },
    { "role": "user", "content": "make the first harder and add an answer" }
  ],
  "excludedQuestionId": 41   // optional; edit form only
}
```
Backend replays into OpenRouter `messages`: `system(unifiedPrompt + embeddingUniquenessRule)`
then each turn — user `content` verbatim, assistant re-serialized as the canonical
`{questions:[...]}` JSON (this guarantees the model always sees its prior turn in
schema-perfect form — the key reliability lever). Single-shot, `response_format: json_object`,
backend holds nothing between calls.

Response:
```jsonc
{ "drafts": [ <QuestionDraft>, ... ], "notice": "..." }   // notice only on dedup rejection
```
`drafts` carries full `QuestionDraft` objects (FE renders without remapping; `isEasy`/`tags`
set only when the model produced them — so the chat path must NOT hardcode `isEasy=false,
tags=[]` the way `QuestionResponse.draft(...)` does today). `notice` is absent on success;
on dedup the backend returns **200 + notice** (+ any non-duplicate drafts) instead of 502.

**Edit is not special on the wire**: the FE seeds the transcript with a synthetic
`user("Here is the existing question to refine.")` + `assistant(drafts:[existing])` pair, so
`buildEditAiPrompt`/`typeInstructionFor` are deleted with no replacement — the
preserve-untouched-fields rule moves into the unified prompt.

### Unified system prompt (`backend/src/main/resources/prompts/robin-chat.md`)

- **Output**: JSON only, exactly `{ "questions": [...] }`, no prose/markdown. Each item:
  `question`, `questionType ∈ single|multiple|numerical`, `answers[]`, `correctAnswers[]`
  (0-based), `explanations[]` (same length as `answers`, may be empty), `questionExplanation`,
  and `tolerance` for numerical.
- **Type inference** per question; never ask the user to pick a type; mixed types allowed.
- **Language matching** to the user's latest message (suite includes Czech prompts).
- **Counts**: single → ≥2 answers, exactly 1 correct; multiple → ≥2 answers, ≥2 correct;
  numerical → exactly 1 numeric answer, `correctAnswers=[0]`, `tolerance≥0` (non-zero and
  strictly < |answer| when imprecision implied, else 0).
- **Explanations**: per-answer `explanations[]` + `questionExplanation`, lengths matched.
- **Count of questions** = as requested (default 1).
- **Refine/edit preservation** (replaces `buildEditAiPrompt`): re-emit the full updated
  `questions`, preserving every field not asked to change; only change type when the
  instruction requires it.
- **Uniqueness** (existing `embeddingUniquenessRule`, appended at runtime).
- **No context-only fields** (`id`, `workspaceGuid`, `imageUrl`); `tags`/`isEasy` only if asked.

## Commit sequence

Legend: **+S** scenario(s) unskipped · **ADD** code added · **DEL** removed in the same commit.

**C0 — Scaffold skipped suite (specs only, green).** Author all new scenarios as `@skip @ai`,
add the new real-network step defs (hitting `/ai-assistant/chat`) and page-object methods
(multi-version, per-answer-explanation, save-individual, save-all, notice-bubble) so the
suite compiles. Legacy stub scenarios still pass. DEL: nothing.

**C1 — Unified endpoint + prompt (single-turn), create form.** +S `Robin drafts a
single-choice question from a topic`, `Using a chosen version fills the form and closes
the assistant`. ADD: `/ai-assistant/chat` controller method, `robin-chat.md`, transcript
replay in `requestAssistant`, `{drafts}` response as a **new chat DTO** (not
`QuestionResponse.draft` — see Risk 6); `#shared` `QuestionDraft` gets **optional
`isEasy?`/`tags?`** (ripples into `questionToPatch`, `questionDraftToRequest`, spec
helpers); `postAiAssistantChat` in `make/api/ai-assistant.ts`; `use-robin-prompt-form.ts`
sends `messages:[{role:'user',content}]` to the new endpoint; create branch of
`robin-ai-helper.tsx` uses it; per-answer + per-question explanation rendering in
`robin-sheet.tsx` (new `robin-generated-answer-explanation` testid). DEL: create-form
**stub** scenarios (`Using a generated question fills the form…` and any other create-form
scenario relying on `Given Robin AI will return…`) — the stub no longer intercepts the
migrated surface. Legacy paths stay wired for edit + workspace.

**C2 — Multi-turn + multi-version accumulation (create form).** +S `Refining appends a new
draft version and keeps prior versions usable`. ADD: hook **accumulates** turns (append
assistant drafts as a new version block instead of replacing; send full `messages[]` each
call); `robin-sheet.tsx` renders all versions, each independently Usable. This is real new
state, not wiring. DEL: the replace-drafts dead path; the `@ai` scenario `Regenerate
replaces the previous AI draft` (asserts the replace semantics this commit removes).

**C3 — Delete FE wrapper; edit on unified chat.** +S `Editing preloads the
existing question as the first draft and refines it in chat`. ADD: edit branch seeds the
synthetic opening pair; sends `excludedQuestionId`. DEL: `buildEditAiPrompt`,
`typeInstructionFor`, `editGenerateRequest`; edit stub scenarios (incl. the 3 `stubbed AI`
edit-context ones). The type radio and its steps stay until C4 — the shared `RobinSheet`
still serves the workspace's legacy `/batch` path, which needs `questionType`.

**C4 — Workspace on unified chat; Save individual + Save all; type selector dies.** +S
`Workspace Robin saves a single draft`, `Save all persists every draft`, and the rewritten
numerical scenarios. ADD: `workspace-robin-ai-helper.tsx` uses
`postAiAssistantChat`; per-draft Save + Save-all wired to `saveQuestion`/`onQuestionsSaved`;
`saveGeneratedQuestion(index)`, `saveAllGeneratedQuestions()` in the page object. DEL (last
consumer migrated): `postAiAssistant`/`postAiAssistantBatch`; old `/ai-assistant` +
`/ai-assistant/batch` controller methods; `generateQuestions*`,
`chooseSystemPrompt`/`chooseBatchSystemPrompt`, the six `.md` prompts, per-type validators
used only by the old path; `AiAssistantRequest` dead `workspaceGuid` field + 2 compat
constructors; the `Given Robin AI will return these generated questions:` step + remaining
stub scenarios (all of `Workspace.AIAssist.Chat/Batch/Numerical`); the
`QuestionTypeRadioSet` block + `questionType`/`onQuestionTypeChange` plumbing;
`askForSingle/Multiple/Numerical` page-object methods + `I ask AI for (type) question(s):`
steps; `Question.AIAssist.Numerical.feature` rewritten to natural-language prompts (keep
the tolerance-bounds Outline). (Sequencing note: **C7 runs before this commit** — see Risks.)

**C5 — Mixed-type, any-number in one turn.** +S `One turn produces mixed question types`.
ADD: typically zero code (emergent from the unified prompt); at most a sharpening sentence.
DEL: nothing (the numerical fold and the redundant workspace feature files already went in
C4).

**C6 — Dedup-as-chat-message.** +S `Robin refuses a duplicate with a chat message and lets
the maker continue` (phrase on the deterministic **exact-match** dedup path: seed the
existing question with `X-Skip-Embedding` so the uniqueness rule stays out of the system
prompt and only exact-text matching fires). ADD: backend returns 200 + `notice` (+ filtered
drafts) instead of 502; FE renders `notice` as an assistant bubble and keeps the composer
alive. DEL: the 502 `duplicateGenerationFailure()` terminal action on the chat path (keep
embedding logic) **and the silent one-shot retry** — in a conversation the maker's next
message is the retry, and with the auto-retry in place the notice path is deterministically
unreachable (the retry feedback steers the model away from the duplicate, so the second
attempt succeeds and no notice ever surfaces).

**C7 — Remove AI from MCP (separate commit).** DEL: `quizmaster_generate_question_draft`
from `mcp/src/tools.ts` (tuple + `registerTool`), `generateQuestionDraftInputSchema` from
`mcp/src/schemas.ts`, `generateQuestionDraft()` from `mcp/src/quizmaster-client.ts` (calls
`/ai-assistant`), the `mcp/src/prompts.ts` reference; update MCP tool-count tests + docs.

**C8 — Docs sweep.** Update `docs/ai-assistant.md`, `docs/domain-language.md`, the
`CLAUDE.md` AI Assistant section, `docs/mcp/*`; resolve/trim this file and
`backlog/ai-assistant-refactor.md`. No code.

## Scenario suite (all real `@ai`; most start `@skip`)

`Question.AIAssist.feature` (create + edit):
- `Robin drafts a single-choice question from a topic` (C1)
- `Robin drafts a multiple-choice question` (C1/C2)
- `Refining appends a new draft version and keeps prior versions usable` (C2)
- `Using a chosen version fills the form and closes the assistant` (C1)
- `Editing preloads the existing question as the first draft and refines it in chat` (C3)
- `Editing preserves untouched fields when refining` (C3)

`Question.AIAssist.Numerical.feature` (rewritten to natural-language prompts in C4):
- `Robin drafts a numerical question with answer and tolerance` (C1)
- `Vague tolerance request yields non-zero tolerance bounded by the answer` (Outline, C4)

`Workspace.AIAssist.feature`:
- `Workspace Robin saves a single draft` (C4)
- `Save all persists every draft` (C4)
- `One turn produces mixed question types` (C5)
- `Robin shows per-answer and per-question explanations` (C1/C4)
- `Robin refuses a duplicate with a chat message and lets the maker continue` (C6)

**Delete entirely** (stub-driven, replaced): all `Workspace.AIAssist.Chat/Batch` stub
scenarios, stub create/edit scenarios, the `Given Robin AI will return these…` step
(`gui.ts:111`), and the pointless negative-layout scenarios (`composer docked`,
`no send button`).

## Flakiness mitigations (`@ai`)

Assert **structure/counts/preserved-cardinality, never LLM prose**. Specifically: single →
≥2 answers + exactly 1 correct badge; multiple → ≥2 correct via the `…AtLeast` poll helpers;
refine → assert version **count = 2** and answer-count **delta**, not question-text equality;
edit-preserve → assert answer-count and correct-count cardinality; numerical → answer parses
as a number and `0 < tolerance < |answer|` (use forced arithmetic like "5/2 → 2.5" only when
deterministic); mixed-type → enumerate the three types in the prompt and assert counts of
structural classes (≥1 numerical, ≥1 with ≥2 correct, ≥1 with exactly 1 correct) — this is
the canary, split into 2 types if flaky; **dedup → use the exact-match path** (deterministic
normalizer) and assert a bubble appears + composer enabled, not its wording; Czech prompts →
assert draft counts (language-independent).

## Risks / ordering hazards

1. **Two-prompt window** — mitigated: new endpoint coexists; legacy deleted only in C4.
   Don't delete `/batch` before workspace migrates.
2. **MCP client coupling** — `mcp/src/quizmaster-client.ts` calls `/ai-assistant`.
   **Adopted: C7 runs before C4** (see execution order above); it's independent of the
   Robin rewrite.
3. **Dedup contract change is breaking** — `notice` + 200-instead-of-502 must land atomically
   with the FE bubble (C6); keep 502 until then; don't add `notice` speculatively.
4. **Multi-version state is real new logic** (hook currently replaces) — budget C2 accordingly.
5. **Per-answer explanation rendering is net-new** (no testid today) — lands in C1.
6. **`isEasy`/`tags` pass-through** — the chat path must not reuse
   `QuestionResponse.draft(...)`'s hardcoded `isEasy=false, tags=[]`, or req 7 can't be tested.
7. **Stub-removal timing** — because the new path is `/ai-assistant/chat`, the legacy stub
   silently stops matching once a surface migrates; delete each stub scenario in the same
   commit its surface moves (**C1 create**, C3 edit, C4 workspace).
8. **`bddgen` fails on undefined steps even for `@skip` scenarios** — never delete a step
   definition before the last feature-file reference to it goes; this is what pins the
   type-radio steps and the numerical-feature rewrite to C4.

## Verification

- Per commit: `pnpm code && pnpm test:be:local && pnpm test:e2e`; confirm `git status` clean
  after `pnpm code`. With `OPENROUTER_API_KEY` set, the unskipped `@ai` scenario runs for
  real; without it, note the skip in the PR so a reviewer with the key runs it.
- Backend AI behavior also covered by `pnpm test:be:ai` (`@Tag("ai")`), gated by
  `assumeTrue(!apiToken.isBlank())`.
- Manual smoke: create-question form → open Robin → ask → refine → see two versions → Use
  one → form fills; edit a question → existing preloaded as draft 1 → refine → Use; workspace
  → ask for several → Save one / Save all → list updates; ask for an exact duplicate → chat
  notice, composer still usable.
- MCP (C7): `quizmaster_generate_question_draft` no longer listed; MCP tool tests green.

## Critical files
- `backend/src/main/java/cz/scrumdojo/quizmaster/aiassistant/AiAssistantService.java`,
  `AiAssistantController.java`, `AiAssistantRequest.java`,
  `backend/src/main/resources/prompts/` (delete six, add `robin-chat.md`)
- `frontend/src/make/create-question/robin-ai/{robin-ai-helper,robin-sheet}.tsx`,
  `use-robin-prompt-form.ts`, `question-draft-mappers.ts`;
  `frontend/src/make/workspace/workspace-robin-ai-helper.tsx`;
  `frontend/src/make/api/ai-assistant.ts`
- `specs/features/make/{question,workspace}/*.AIAssist*.feature`,
  `specs/src/pages/robin-sheet-page.ts`, `specs/src/steps/make/question/gui.ts`
- `mcp/src/{tools,schemas,prompts,quizmaster-client}.ts`
- Docs: `docs/ai-assistant.md`, `docs/domain-language.md`, `CLAUDE.md`, `docs/mcp/*`
