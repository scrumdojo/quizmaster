# Spaced Repetition — Learning Points Across Attempts

## 1. Business need

**As a quiz taker, I want to learn from my mistakes until I reach the norm, and carry my learning points into future quizzes, so that I don't keep missing the same things.**

Origin: workshop story-mapping session, 2026-07-08 (flip chart, persona "quiz taker"). Two activities:

- **Leren van fouten tot de norm** (learn from mistakes until the norm) — finish a quiz,
  see a summary of mistakes, drill into per-question detail. The "HOE?" (how?) box under
  this activity says the system should store learning points via a spaced repetition
  system.
- **Leerpunten meenemen** (carry learning points forward) — start a new quiz that is
  composed using previously saved learning points.

This note captures the four slices of that flow that are **not yet buildable as a clean
Gherkin spec** without further design decisions. Slice 1 — a mistakes summary within a
single completed attempt — is shipped:
`specs/features/take/quiz/Quiz.ScorePage.Mistakes.feature`. Slice 2 — cross-attempt
mistake awareness — is now shipped too:
`specs/features/take/quiz/Quiz.ScorePage.MistakesHistory.feature`.

## 2. What already exists

- `AttemptQuestion` (`backend/.../attempt/AttemptQuestion.java`) stores per-question,
  per-attempt correctness (`AnswerStatus`, `position`, `answeredAt`, `flagged`) — the raw
  data a spaced-repetition feature would read is already there.
- `AttemptQuestionRepository` currently only queries by `attemptId` (single or list) or
  `attemptId` + `questionId`. There is **no query across attempts** for a given taker or
  question — that's new work for every slice below.
- `docs/product-overview.md` already names this gap explicitly: takers are anonymous, no
  login-backed learner history, no "your weak areas," no spaced repetition. This isn't an
  oversight to fix quietly — the doc should be updated once any slice below ships.

## 3. The blocker: taker identity

Takers have no account. The only thing linking attempts together is `nickname` +
`cohortGuid` on `Attempt` — a per-workshop label, not a durable identity.

**Decision (2026-07-08):** use `nickname` + `cohortGuid` as a "good enough" proxy for
identity, scoped to one cohort/workshop, rather than blocking this whole effort on
building real accounts first.

**Caveats to keep in mind when scoping slices 2–4:**

- Two different people using the same nickname in a cohort are indistinguishable.
- One person retaking under a different nickname loses their history.
- History does not survive past the cohort — there's no cross-workshop identity at all.
- If a real login/account system is ever introduced, this proxy should be revisited and
  the slices below re-scoped against real identity.

## 4. Slices

### Slice 2 — Cross-attempt mistake awareness ("you've missed this before") — shipped

Inline note on the score page when a question the taker just got wrong (or partially
wrong) was also missed in an earlier attempt by the same `nickname` + `cohortGuid`.

**Shipped (2026-07-08):** `specs/features/take/quiz/Quiz.ScorePage.MistakesHistory.feature`
(3 scenarios, all passing). Scope was narrowed to make it buildable now: same quiz only,
comparing the taker's own prior attempt(s) of that same quiz — not the broader "any
attempt in the cohort" or "same question across different quizzes" cases below, which
remain open.

- `AttemptRepository.findEarlierFinishedAttempts` — a null-safe JPQL query matching
  `quizId` + `nickname` + `cohortGuid`, excluding the current attempt, finished attempts
  only.
- `AttemptService.questionIdsMissedInEarlierAttempts` derives the "missed before" set at
  request time from existing `AttemptQuestion` rows — no new entity, nothing persisted
  separately.
- `QuizEvaluationResponse` / `QuestionEvaluationResponse` gained a `missedBefore` boolean
  per question, threaded through from `QuizTakeController.evaluateQuiz`.
- New E2E step in `specs/src/steps/take/quiz/quiz.ts`: `Given I start quiz "X" for cohort
  "Y" again` — reuses the `Cohort ${cohortName}` nickname convention (now a shared
  `cohortParticipantNickname` helper in `specs/src/steps/quiz/ops.ts`) so a repeat cohort
  visit resolves to the same taker identity as the attempt seeded via
  `seedFinishedCohortAttemptViaUI`.
- Open questions (still unresolved, out of scope for this slice): how far back to look
  when attempts span multiple quizzes (all attempts in the cohort, or only attempts on the
  same quiz?); does a question asked in two different quizzes count as "the same" mistake?

### Slice 3 — Persistent view of accumulated mistakes across attempts

Same derived data as slice 2, but as its own page/section rather than an inline note.

- Needs a new taker-facing UI surface — today taking is stateless beyond `/quiz/:id` and
  the score page; there's no "my history" page to land on.
- Open questions: entry point/navigation (how does a taker get back to this after closing
  the tab?); does it need to survive a page refresh (likely keyed on nickname + cohort in
  the URL or local storage)?

### Slice 4 — Review quiz seeded from learning points

A new take-flow: starting a quiz composed on the fly from questions the taker previously
missed, instead of a maker-authored fixed question set.

- Depends on slices 2–3 existing (need the derived mistake data first).
- Open questions before this is spec-able: question pool scope (same quiz only, or
  workspace-wide?); how many questions; what "resolves" a learning point (one correct
  answer, or several in a row — this overlaps with slice 5); where the entry point lives
  in the UI.

### Slice 5 — Actual spaced-repetition scheduling

The "HOE?" middle box: interval-based due-dates (SM-2-style spacing), tracking when a
learning point becomes "due" for review again, rather than always resurfacing every past
mistake.

- Different order of feature than slices 2–4: this is a scheduling/algorithm concern, not
  a request-time derived view. Likely needs its own data model (due dates, review
  intervals) and a design spike before any Gherkin is written.
- Biggest open design question of the five slices — do not attempt to spec this
  alongside slice 4; it should get its own design note first.

## 5. Sequencing

Slice 1 (done) → 2 (done) → 3 → 4 → 5, each building on the previous. Slice 2 alone
already delivers taker value (awareness of recurring mistakes) without committing to the
bigger review-quiz or scheduling work.

## 6. Notes

- Related: `specs/features/take/quiz/Quiz.ScorePage.Mistakes.feature` (slice 1),
  `specs/features/take/quiz/Quiz.ScorePage.MistakesHistory.feature` (slice 2, shipped).
- `docs/product-overview.md`'s "no spaced repetition" line still holds — slices 1–2 are a
  same-attempt/same-quiz mistakes summary, not spaced repetition proper (no scheduling, no
  cross-quiz learning points yet). Revisit that line once slice 5 ships.
- The nickname + cohort identity proxy (§3) is a deliberate, scoped compromise — flag it
  for re-evaluation if real taker accounts are ever introduced.
