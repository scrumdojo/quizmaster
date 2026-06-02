# AI Assistant — End-to-end refactor

Plan derived from the code review on 2026-05-15. The headline diagnosis: the
feature is shaped around `(questionType × single|batch)`, so the system prompt
has six variants and the request DTO carries a single `questionType`. That
shape blocks two extensions the user wants:

1. **Editing an existing question** (draft or persisted) in the create/edit
   form, where the maker patches individual fields/answers and the rest is
   preserved. Partially supported today via a frontend-built wrapper prompt;
   unreliable across type combinations.
2. **Mixed-type batches** — currently a batch must be all the same type.

The architectural move that unblocks both is the same: **one unified prompt,
the response declares per-question type, drop the type switch**. Everything
else in this plan either sets up that move or cleans up around it.

Two pre-existing backlog files overlap with parts of this plan and remain
authoritative for their scope:

- [`ai-assistant-service-refactor.md`](./ai-assistant-service-refactor.md) —
  overload collapse in the service, observability for embedding failures.
  Step 1 below uses its DTO collapse as a prerequisite but does not duplicate
  the observability work.
- [`robin-workspace-intent.md`](./robin-workspace-intent.md) — replaces the
  workspace heuristic detectors with explicit buttons. Step 9 below absorbs
  that plan.

## Working approach

- One worktree, one branch off `master`. Each step below is **one commit**
  unless explicitly noted as "split into N".
- Every commit is independently shippable: code + tests + docs + spec moves
  together (see [memory: vertical slices](../.claude/projects/-home-dev-workspace-quizmaster/memory/feedback_vertical_slices.md)
  in spirit — no infrastructure commit without a wired-in caller).
- Pre-commit gate per commit: `pnpm code && pnpm test:be:local && pnpm test:e2e`.
  E2E is not optional ([memory: e2e before commit](../.claude/projects/-home-dev-workspace-quizmaster/memory/feedback_e2e_before_commit.md)).
- Doc updates (`docs/ai-assistant.md`, `CLAUDE.md` AI Assistant section) ride
  with the commit that changes the behavior they describe — never as a
  follow-up.
- The big moves (Steps 3, 4, 7) are sequenced so the codebase stays green
  between commits. We never carry "two prompt systems half-wired" across more
  than one commit.

## Sequence

```
Step 0  Baseline — no behavior change, only inventory & test gaps captured
Step 1  Tidy AiAssistantRequest (dead field, validation)            (Sg 6)
Step 2  Tidy AssistantResponse + controller test JSON               (Sg 10, 7)
Step 3  Backend: AssistantResponse declares questionType            (Sg 1 - part A)
Step 4  Backend: one unified prompt, drop the six .md files         (Sg 1 - part B)
Step 5  Backend: fix batch excludedQuestionId                       (Sg 4)
Step 6  Spec: numerical-edit scenarios                              (Sg 8)
Step 7  Backend: edit semantics in BE prompt + existingQuestion     (Sg 3 - BE)
Step 8  Frontend/MCP: drop FE edit wrapper, send existingQuestion   (Sg 3 - FE/MCP)
Step 9  Workspace intent: composer buttons, drop heuristics         (Sg 5)
Step 10 Endpoint unification: one endpoint, always array response   (Sg 2)
Step 11 Docs sweep                                                  (Sg 9)
```

Steps 1, 2, 5, 6 are independent and can land in any order before step 3.
Steps 3 → 4 → 7 → 8 → 10 are a directed chain — do not reorder.
Step 9 is fully independent.
Step 11 is the only follow-up commit.

---

## Step 0 — Baseline (no commit)

Before opening the worktree branch:

- Confirm `master` builds clean: `pnpm code && pnpm test:be:local && pnpm test:e2e`.
- Note: `Workspace.AIAssist.Batch.feature` and `Workspace.AIAssist.Chat.feature`
  carry `@ai` scenarios that hit OpenRouter — they require `ai.token` in
  `application-local.properties`. If the token is missing locally, those
  scenarios are skipped; the refactor must not regress that skip behavior.
- Inventory the magic strings to be replaced: search
  `"single"|"multiple"|"numerical"` across `backend/.../aiassistant/`,
  `frontend/src/make/`, and `mcp/src/`. Used by the inventory check at the end
  of Step 3.

No commit produced; outputs are notes for the working session.

---

## Step 1 — Tidy `AiAssistantRequest` (Suggestion 6)

**Scope:** `backend/src/main/java/cz/scrumdojo/quizmaster/aiassistant/AiAssistantRequest.java`,
`AiAssistantController.java`, `AiAssistantControllerTest.java`,
`AiAssistantServiceTest.java`.

**Changes:**

- Delete the dead `workspaceGuid` field and the two compatibility constructors
  (`AiAssistantRequest.java:5-11`). The record becomes
  `record AiAssistantRequest(String question, String questionType, Integer excludedQuestionId)`.
- Add `jakarta.validation.constraints` annotations:
  `@NotBlank String question`, `@NotBlank String questionType`. Per
  `controller-style.md:12-15`. (Keep `questionType` as `String` for now;
  Step 3 introduces a stricter contract.)
- Add `@Valid` to both `@RequestBody` parameters in `AiAssistantController.java:27-40`.
- Update the existing 400 test (`AiAssistantControllerTest.java:84-93`) to
  assert the bean-validation 400 (text-block JSON not relevant here; status
  alone is sufficient).
- Service-test call sites: `AiAssistantService` still has the overloaded
  `generateQuestion(prompt, type)` etc. — leave those alone in this step.
  They're covered by `ai-assistant-service-refactor.md` and aren't needed for
  the type-system work.

**Independent:** yes. No spec changes.

**Commit message:** `refactor(aiassistant): drop dead workspaceGuid field and add request validation`

**Pre-commit check:** `pnpm code && pnpm test:be:local && pnpm test:e2e`.
Watch for: any caller building `AiAssistantRequest` with the three-arg
constructor. None exist in production today (`grep` for `new AiAssistantRequest(`);
test fixtures use the no-arg setters or the two-arg form.

---

## Step 2 — Tidy `AssistantResponse` + controller-test JSON (Suggestions 10, 7)

**Scope:** `AiAssistantService.java` (record at line 491-498),
`AiAssistantControllerTest.java`.

**Changes:**

- Remove `@JsonProperty("tolerance")` and `@JsonProperty("questionExplanation")`
  on `AssistantResponse` — record component names already match the JSON keys.
- Convert the two `@Tag("ai")` happy-path assertions in
  `AiAssistantControllerTest.java:33-81` from `jsonPath` chains to a single
  `content().json(...)` text block per `controller-style.md:36-37`.
    - The text body of `question` and individual `answers` vary across LLM
      calls — keep `jsonPath` only for those slots. The shape (`answers.length`,
      `correctAnswers.length`, `explanations.length`, top-level keys) goes into
      the JSON text block, using `Customization.STRICT_ORDER == false` defaults.
    - If the contract is too tight for non-deterministic LLM output, split into
      a shape check (JSON text block of empty arrays with correct lengths) and a
      contentful jsonPath for the dynamic strings.
- The 400/404 tests already use status-only assertions; no change.

**Independent:** yes. No spec changes.

**Commit message:** `refactor(aiassistant): use content().json for controller tests, drop redundant JsonProperty`

**Pre-commit check:** as above.

---

## Step 3 — `AssistantResponse` declares `questionType` (Suggestion 1, part A)

This is the **load-bearing change**. After this step, the response shape can
carry mixed types; in the next step we wire one prompt that uses it.

**Scope:** `AiAssistantService.java`, `AiAssistantServiceTest.java`,
`AiAssistantControllerTest.java`. Six prompt files are touched but only to add
a `"questionType"` line to each example block — they are deleted whole in
Step 4.

**Changes:**

- Extend `AssistantResponse` to include
  `String questionType` (line 491-498).
- Update each prompt's example JSON to include a literal `"questionType"`
  field (`"single"` / `"multiple"` / `"numerical"`) and add one rule line:
  _"Always include `questionType` matching the requested type."_ This keeps
  every prompt internally consistent while still being type-specialized;
  Step 4 will unify them.
- `validateForType(response, resolvedType)` (line 353-360) gets a guard at
  the top:
    ```java
    if (response.questionType() == null || !response.questionType().equals(resolvedType)) {
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
            "AI assistant returned invalid response: questionType mismatch.");
    }
    ```
    — i.e. for now we still pass `resolvedType` (the FE-chosen type) and
    require the model to echo it. The two collapse into one in Step 4.
- `toDraftResponse(...)` (line 469-479) now reads
  `assistantResponse.questionType()` instead of taking it as a parameter.
- New tests: `validateResponse_questionTypeMismatch`,
  `validateResponse_questionTypeMissing` in `AiAssistantServiceTest.java`.

**Why this is its own commit:** it changes the response contract with the LLM
(prompt-level) without changing the request shape. If something breaks in
production (e.g. the LLM stops echoing `questionType`), revert is one commit.

**Spec impact:** none — the FE doesn't read `questionType` off the wire
differently; it already trusts what the BE returns via `QuestionDraft`.

**Commit message:** `refactor(aiassistant): require AssistantResponse to declare questionType`

**Pre-commit check:** as above. The `@ai` scenarios are the real
truth test here — they exercise actual LLM responses against the new contract.

---

## Step 4 — One unified prompt, drop the six `.md` files (Suggestion 1, part B)

**Scope:** `backend/src/main/resources/prompts/*.md` (delete six, add one),
`AiAssistantService.java`.

**Changes:**

- Add `backend/src/main/resources/prompts/draft-question.md` covering all
  three types in one document:
    - One "rules" section (language matches prompt, output JSON only,
      `questionExplanation` empty unless requested, etc.).
    - Three labeled type sections (single / multiple / numerical) each with the
      answer-count rule and a JSON example carrying its own `"questionType"`.
    - One "edit-or-create" note: _"If the user provides a `currentQuestion`
      JSON, modify only the fields the instruction asks about and preserve
      the rest."_ — wired in fully at Step 7, but mention it here so the
      Step 7 commit is a behavior change, not a prompt rewrite.
    - One "batch" note: _"If the user asks for N questions, return an array
      of N items; otherwise return an array of 1 item."_ Even single-question
      callers receive `{"questions": [...]}` from the LLM — simplifies the
      handler.
- Delete the six existing `.md` files in the same commit.
- In `AiAssistantService.java`:
    - One `loadPrompt("prompts/draft-question.md")` in the constructor; drop
      the six fields and the six loads (lines 41-46, 63-68).
    - Delete `chooseSystemPrompt` and `chooseBatchSystemPrompt` (lines 335-351).
    - `generateCandidate` and `generateBatchCandidate` now both prepend the
      same prompt + `embeddingUniquenessRule`.
    - **Important**: this commit still passes `questionType` to the prompt as
      a request hint (via the user-message body) so behavior is unchanged.
      Mixed-type batching becomes possible architecturally but is not yet
      exercised — the FE still sends one type.
- Update `AssistantBatchResponse` is unchanged; it already wraps `responses`.
- Adjust `AiAssistantServiceTest`'s validation tests to drop the per-type
  prompt assumption.

**Why this can land before Step 7:** the unified prompt's edit-or-create
note is documentation-only at this point; nothing in the request carries a
`currentQuestion` until Step 7. The note costs nothing and avoids a prompt
rewrite later.

**Spec impact:** the existing `@ai` scenarios exercise the new prompt
end-to-end. If the LLM produces measurably different output (e.g.
question-type echoing fails), it shows up here. Adjust prompt wording within
this commit; do not let Step 5 follow before specs are green.

**Commit message:** `refactor(aiassistant): collapse six prompts into one unified draft-question prompt`

**Pre-commit check:** as above; pay special attention to `@ai`
scenarios in `Question.AIAssist.feature` and `Workspace.AIAssist.Batch.feature`.
Skipped without `ai.token` — if skipped, flag this in the PR description
so a reviewer with the token can run them before merge.

---

## Step 5 — Fix batch `excludedQuestionId` (Suggestion 4)

**Scope:** `AiAssistantService.java:107-134`, `AiAssistantController.java:34-40`,
`AiAssistantServiceTest.java`.

**Changes:**

- `generateQuestions(prompt, questionType)` and the two-arg overload disappear.
  Keep one entry point `generateQuestions(prompt, questionType, workspaceGuid,
excludedQuestionId)`. (Consistent with `ai-assistant-service-refactor.md`'s
  collapse direction.)
- Line 115 becomes
  `questionEmbeddingService.usableWorkspaceEmbeddings(workspaceGuid, excludedQuestionId);`.
- Controller batch endpoint passes `request.excludedQuestionId()`.
- New service test in `AiAssistantServiceTest.java`: assert that a batch call
  with `excludedQuestionId` set does not surface the excluded question as a
  duplicate. Pattern: extend the existing `usableWorkspaceEmbeddingsCanExcludeQuestionBeingEdited`
  test (line 65-80) with a batch-mode counterpart, using stub embeddings to
  avoid hitting the LLM.

**Spec impact:** no FE caller passes `excludedQuestionId` to `/batch` today,
so no Gherkin scenario changes. The unit test is the regression guard.

**Commit message:** `fix(aiassistant): batch generation now honors excludedQuestionId`

**Pre-commit check:** as above.

---

## Step 6 — Numerical-edit Gherkin coverage (Suggestion 8)

**Scope:** `specs/features/make/question/Question.AIAssist.Numerical.feature`,
`specs/src/steps/make/question/gui.ts` (potentially), step glue.

**Changes:**

- Add at least three scenarios:
    - _Robin updates the numeric answer of an existing numerical question_ —
      open existing question, ask "change the answer to 42", assert answer
      becomes 42, tolerance preserved.
    - _Robin updates tolerance of an existing numerical question_ — assert
      answer preserved, tolerance becomes the requested value.
    - _Robin rewords the question of an existing numerical question_ — assert
      answer and tolerance preserved, question text changes.
- Use the same stub pattern as `Question.AIAssist.feature:118-135` (stubbed
  AI returning a known payload).
- This step **must run on master's behavior** — i.e. these scenarios should
  pass against the code _as it exists after Step 4_ and continue passing
  after Steps 7-8. They lock in the behavior the user described as
  unreliable. If they fail on master, that's the bug to address inside
  Step 7.

**Independent:** yes (in the sense that it can land alone), but its real
value is paired with Steps 7-8.

**Commit message:** `test(specs): add numerical-edit scenarios for Robin`

**Pre-commit check:** `pnpm test:e2e` is the primary signal here.

---

## Step 7 — BE: edit semantics in the prompt + `existingQuestion` field (Suggestion 3, BE half)

**Scope:** `AiAssistantRequest.java`, `AiAssistantService.java`,
`AiAssistantController.java`, `prompts/draft-question.md`,
`AiAssistantControllerTest.java`, `AiAssistantServiceTest.java`.

**Changes:**

- Extend `AiAssistantRequest` (now without `workspaceGuid`) with one optional
  field: `QuestionDraft existingQuestion`. (Define `QuestionDraft` as a Java
  record in `cz.scrumdojo.quizmaster.aiassistant` mirroring the shared TS
  type. Reuse `QuestionResponse.draft(...)` shape — fields:
  `question, answers, correctAnswers, explanations, questionExplanation,
tolerance, questionType`.) Use `@Valid` cascading is unnecessary for now —
  it's pass-through data for the LLM.
- In the unified prompt, promote the "edit-or-create" note added in Step 4
  to the load-bearing instruction: _"If the request includes
  `currentQuestion`, treat it as the current state; apply only the user's
  instruction; preserve every field the instruction does not need to
  change."_
- In `AiAssistantService`, format `existingQuestion` as a JSON block in the
  _user_ message (after the maker's instruction), not the system message.
  This keeps the system prompt static and lets prompt caching (if any)
  remain effective.
- Add new BE tests asserting that:
    - When `existingQuestion` is null, behavior matches today.
    - When `existingQuestion` is present, the system prompt is unchanged and
      the user message carries the JSON.
    - The 400 path for malformed `existingQuestion` (when its `questionType`
      doesn't match `request.questionType()` — that's an obvious user error).
- Document the new field in `docs/ai-assistant.md` (the "RobinFormBinding"
  section already talks about the FE contract; add an "Edit-or-create"
  paragraph under `AiAssistantService`).

**Why this commit also touches `prompts/draft-question.md`:** the
edit-or-create note in Step 4 was documentation; now it's behavior. Keeping
prompt + behavior in one commit avoids a "prompt says one thing, code does
another" interleaving.

**Spec impact:** existing `Question.AIAssist.feature:118-168` scenarios
continue to pass — the stubbed AI doesn't care which message the JSON lives
in. Step 6's numerical-edit scenarios are now exercised against the new
prompt instruction (they were passing on Step 4 too, but for the wrong
reason — see Step 8 for the FE half).

**Commit message:** `feat(aiassistant): backend accepts existingQuestion for in-place edits`

**Pre-commit check:** `pnpm test:e2e` — primarily the `@ai` scenarios
to confirm the LLM follows the new edit instruction.

---

## Step 8 — FE/MCP: drop edit wrapper, send `existingQuestion` (Suggestion 3, FE/MCP half)

**Scope:** `frontend/src/make/create-question/robin-ai/robin-ai-helper.tsx`,
`frontend/src/make/api/ai-assistant.ts`, `mcp/src/schemas.ts`,
`mcp/src/tools.ts`, `mcp/src/quizmaster-client.ts`.

**Changes:**

- Delete `buildEditAiPrompt`, `editGenerateRequest`, `typeInstructionFor`
  from `robin-ai-helper.tsx:21-56`.
- `RobinAiHelper` always calls `postAiAssistant` with the form snapshot
  serialized as `existingQuestion` when `currentQuestion` is non-null;
  otherwise omits the field.
- `postAiAssistant` request type gains `existingQuestion?: QuestionDraft`
  (`frontend/src/make/api/ai-assistant.ts:4-11`).
- MCP: extend `generateQuestionDraftInputSchema`
  (`mcp/src/schemas.ts:187-191`) with an optional `existingQuestion` Zod
  shape. Update `quizmaster_generate_question_draft` tool description
  (`mcp/src/tools.ts:287`) to mention the edit use case. The MCP client's
  `generateQuestionDraft` (`mcp/src/quizmaster-client.ts:192-200`) just
  forwards the body — no extra mapping needed.
- New MCP test asserting the schema accepts/rejects `existingQuestion`
  payloads (mirror existing schema tests).

**Spec impact:** the existing edit scenarios
(`Question.AIAssist.feature:118-168`) and Step 6's numerical-edit scenarios
all stay green. The "AI received current question context" Then-clauses now
match because the BE actually sees structured `existingQuestion`, not a
string-wrapped JSON. **This is the commit where editing becomes reliable.**

**Commit message:** `feat(robin): send existingQuestion to backend instead of wrapping it in the prompt`

**Pre-commit check:** the numerical-edit scenarios from Step 6 are the
sharpest signal; `@ai` scenarios that actually exercise edits are
secondary.

---

## Step 9 — Workspace intent: composer buttons, drop heuristics (Suggestion 5)

This step **subsumes** [`robin-workspace-intent.md`](./robin-workspace-intent.md).
If that file's plan has been refined since, prefer its detail; the bullets
below are the integration view.

**Scope:** `frontend/src/make/workspace/workspace-robin-ai-helper.tsx`,
`frontend/src/make/create-question/robin-ai/robin-sheet.tsx`,
`specs/features/make/workspace/Workspace.AIAssist.Chat.feature`,
`specs/features/make/workspace/Workspace.AIAssist.Batch.feature`,
`specs/src/pages/robin-sheet-page.ts`.

**Changes:**

- Add a count selector + "Generate" button to the chat composer (when
  `mode === 'chat'`). Default count: 1.
- Add a "Save all drafts" button that appears once `generatedDrafts.length > 0`.
- Delete `wantsMultipleQuestions` and `isSaveGeneratedQuestionsPrompt`
  (`workspace-robin-ai-helper.tsx:22-64`). `generateWorkspaceRobinDrafts`
  branches on a `mode: 'generate' | 'save'` argument passed by the button
  click handlers instead.
- `robin-sheet-page.ts` gains `clickGenerate(count?)` and `clickSaveAll()`.
- Update Gherkin scenarios in `Workspace.AIAssist.Chat.feature` and
  `Workspace.AIAssist.Batch.feature` to drive the buttons. The Czech
  `"Vytvor 2 otazky..."` and `"Uloz to"` strings disappear from
  step calls; the assertions on chat-message echoes remain (the
  user's typed prompt is still echoed as a chat bubble).
- Update `docs/ai-assistant.md` if it mentions the heuristic detectors.

**Independent:** yes (entirely separate from the prompt/contract chain).

**Commit message:** `refactor(robin): replace workspace intent heuristics with explicit composer buttons`

**Pre-commit check:** `pnpm test:e2e` — primarily
`Workspace.AIAssist.Chat.feature` and `Workspace.AIAssist.Batch.feature`.
After this lands, mark `robin-workspace-intent.md` as resolved (delete it
per `CLAUDE.md`'s "completed planning → docs/" rule, or leave a stub
linking to this file's commit).

---

## Step 10 — One endpoint, always-array response (Suggestion 2)

**Scope:** `AiAssistantController.java`, `AiAssistantService.java`,
`AiAssistantRequest.java`, `frontend/src/make/api/ai-assistant.ts`,
`frontend/src/make/create-question/robin-ai/robin-ai-helper.tsx`,
`frontend/src/make/workspace/workspace-robin-ai-helper.tsx`,
`mcp/src/quizmaster-client.ts`, `mcp/src/schemas.ts`, `mcp/src/tools.ts`,
plus relevant specs/tests.

This is the last big move and the one that fully unblocks mixed-type batches
from the wire's perspective.

**Changes:**

- Extend `AiAssistantRequest` with `Integer count` (default null → 1).
  `questionType` becomes optional (a _hint_); when present and
  `existingQuestion` is also present, prompt instructs the LLM to preserve
  the type unless told otherwise; when both are absent, the LLM picks per
  question (mixed-type batch).
- Collapse the two endpoints into one
  `POST /api/workspaces/{workspaceGuid}/ai-assistant` that always returns
  `QuestionResponse[]` (length 1 for the common case, N for batch). The old
  `/batch` endpoint is removed.
- `AiAssistantService.generateQuestion` is removed; only
  `generateQuestions` remains, returning `QuestionResponse[]` always.
  Single-question callers take `result[0]`.
- The unified prompt's "batch note" added in Step 4 becomes the load-bearing
  format: the LLM always returns `{"questions": [...]}` with N items
  (`AssistantBatchResponse` is the only shape).
- Update FE:
    - `postAiAssistant` returns `readonly QuestionDraft[]`. Single-draft
      callers do `[draft] = await postAiAssistant(...)`.
    - `postAiAssistantBatch` disappears.
    - `workspace-robin-ai-helper.tsx`: drop the `wantsMultipleQuestions`
      branch (already gone in Step 9). The count selector now drives the
      `count` field of the request body.
- Update MCP:
    - `quizmaster_generate_question_draft` tool returns
      `readonly QuestionDraft[]`. Tool description updated.
    - Backwards-compatibility: if MCP consumers depend on a single-object
      response shape, this is a breaking change — call it out in the commit
      message and `docs/mcp/overview.md`. Per the user's earlier guidance,
      this is a training app, not an enterprise system; breaking changes are
      fine if documented.
- Update Gherkin: any scenario expecting the singular endpoint or shape;
  in practice the specs go through the page object, so changes are local
  to `robin-sheet-page.ts` and one-or-two step glue files.

**Why this is last:** mixed-type batches require the response to declare
type per item (Step 3), the prompt to handle it (Step 4), and the edit
flow to use structured `existingQuestion` (Steps 7-8). Doing this earlier
would force a two-system bridge across multiple commits.

**Commit message:** `refactor(aiassistant): one endpoint, always-array response, mixed-type batches`

Consider splitting into two commits if the diff is large:

- `refactor(aiassistant): service returns array for both single and batch`
- `refactor(aiassistant): controller unifies single and batch endpoints`

The split is fine because step 1 leaves both controller endpoints intact (each
calls into the array-returning service).

**Pre-commit check:** all `@ai` scenarios; the BE controller test suite
(now exercising the unified endpoint); MCP unit tests.

---

## Step 11 — Docs sweep (Suggestion 9)

**Scope:** `docs/ai-assistant.md`, `CLAUDE.md` AI Assistant section, any
backlog file made obsolete by the above.

**Changes:**

- `docs/ai-assistant.md`:
    - "Robin AI is decoupled from forms via `RobinFormBinding`" stays.
    - Replace the implicit type-gating description with: _"Robin generates one
      or more question drafts per request. Each draft declares its own type."_
    - Add an "Edit-or-create" sub-section pointing at the `existingQuestion`
      field.
    - Update "Where to look" if any paths changed during the refactor.
- `CLAUDE.md` AI Assistant paragraph (line 142): rewrite if the
  endpoint shape or behavior summary changed.
- `backlog/`:
    - `ai-assistant-service-refactor.md`: mark resolved or update what
      remains (the observability work is independent and survives).
    - `robin-workspace-intent.md`: mark resolved (subsumed by Step 9).
    - This file: archive or leave for reference.

**Commit message:** `docs(aiassistant): align documentation with the refactored AI assistant`

**Pre-commit check:** `pnpm code` (lint catches some markdown issues; spec
runs aren't necessary for doc-only changes, but include `pnpm test:be:local`
out of habit).

---

## Risk register

- **LLM prompt-following regression after Step 4.** A unified prompt is
  longer than any one specialized prompt and may degrade output quality.
  Mitigation: keep all three example blocks; the `@ai` scenarios are
  the canary; if measurably worse, revert Step 4 and split into "single
  prompt for choice questions" + "numerical prompt", keeping the
  type-declared-in-response gain from Step 3.
- **MCP breaking change in Step 10.** The single→array shape change is
  surface-visible. Mitigation: document, version-bump the MCP package.
- **`ai.token` not configured locally.** Steps 3, 4, 7, 8, 10 should all
  succeed on stubbed scenarios; the `@ai` scenarios are the canary
  for real LLM behavior. If they're skipped locally, leave a clear note in
  each PR description so a reviewer with the token can run them.
- **Cross-step ordering drift.** Steps 3→4→7→8→10 form a chain; each
  intermediate commit must leave the codebase fully green. If a commit
  needs a follow-up fix-up commit on the same step, prefer that over
  bundling two steps into one PR. ([memory: separate commits by concern](../.claude/projects/-home-dev-workspace-quizmaster/memory/feedback_commit_separation.md))

## Sanity checklist for each commit

- [ ] One conceptual change.
- [ ] Code + tests + docs in the same commit.
- [ ] `pnpm code` clean.
- [ ] `pnpm test:be:local` green.
- [ ] `pnpm test:e2e` green (or `@ai` skipped with a note).
- [ ] `git status` clean after `pnpm code` ([memory: commit hygiene](../.claude/projects/-home-dev-workspace-quizmaster/memory/feedback_commit_hygiene.md)).
- [ ] Reviewed by the user before commit ([memory: wait for review](../.claude/projects/-home-dev-workspace-quizmaster/memory/feedback_wait_for_review_before_commit.md)).
