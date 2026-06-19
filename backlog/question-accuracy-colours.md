# Per-Question Accuracy — Colour Coding

## 1. Business need

**As a quiz maker, I want to simply identify the accuracy of answers per question, so I can easily spot problematic questions at a glance.**

The quiz-stats page already shows a per-question accuracy figure, but it is plain grey text in a table. Scanning a long quiz, a maker cannot tell the weak questions from the strong ones without reading every row. Colour-coding the accuracy makes the _"everybody got this wrong"_ questions jump out immediately.

**What counts as "accuracy":** `correctAnswers ÷ answered` — fully-correct only. Partially-correct answers keep their own column and do not change the pill.

## 2. Technical specification

**Scope: frontend only.** No new backend, no new API, no feature flag. The data is already served and the table already exists; we are changing how one cell renders.

**Where the data comes from.** `GET /api/workspaces/{guid}/quizzes/{id}/stats` returns `QuestionStatsRecord` per question (`backend/.../quiz/stats/QuestionStatsRecord.java`): `answered`, `correctAnswers`, `partiallyCorrectAnswers`, `incorrectAnswers`, `unanswered`. Accuracy is derived in the frontend.

**Where it renders today.** `frontend/src/make/quiz-stats/quiz-stats-component.tsx` builds the _Question-level breakdown_ table. The **Correct** column is the accuracy: `rate(question.correctAnswers, question.answered)` (line 47) — a plain `%` string like `91%`.

**The change:** replace that plain text with a rounded, colour-coded **pill** — the percentage centred on a soft colour background, green/amber/red by band.

1. **Let a cell hold a pill.** `StatsTable` (`frontend/src/make/quiz-stats/stats-table.tsx`) renders text-only cells (`rows: readonly (readonly string[])[]` → `<td>{cell}</td>`). Widen the cell type to `string | ReactNode` — rendering is already `{cell}`, so no logic changes and the Summary/Attempts tables are untouched.
2. **Render the pill** in `questionRow` for the Correct column instead of the `rate(...)` string:
   `<span className="accuracy-pill" data-band={band}>{percent}%</span>`.
   The `data-band` attribute is the test hook (E2E asserts the band, not a pixel colour).

The percentage stays visible inside the pill, so the colour is never the only cue.

### Visual design

Reference: open `backlog/design/question-accuracy-colours/accuracy-pill.html`.

- **Value:** `r = answered > 0 ? correctAnswers / answered : 0` · `percent = Math.round(r * 100)` · `band = r >= 0.75 ? 'high' : r >= 0.5 ? 'mid' : 'low'`
- **Bands → colours** (match these; they belong to the existing `--feedback-*` token family in `frontend/src/styles.scss`):

    | Band | Condition      | Background | Text      |
    | ---- | -------------- | ---------- | --------- |
    | high | r ≥ 0.75       | `#dcefdd`  | `#1f6b1f` |
    | mid  | 0.5 ≤ r < 0.75 | `#fcefb8`  | `#8a6300` |
    | low  | r < 0.5        | `#fbdbdc`  | `#8e1f25` |

- **Pill style:** `inline-flex` centred · `min-width:64px` · `padding:5px 12px` · `border-radius:999px` · `font-weight:800` · `font-size:0.9rem` · `font-variant-numeric:tabular-nums`. Static, read-only.
- A question nobody answered shows `0%` in the **low** band — same formula, no special case.
- _Optional:_ a small colour legend under the table (`● ≥ 75%` · `● 50–74%` · `● < 50%`).

**Likely files.**

- `frontend/src/make/quiz-stats/stats-table.tsx` — allow a `ReactNode` cell.
- `frontend/src/make/quiz-stats/quiz-stats-component.tsx` — compute the band and render the pill in `questionRow`.
- `frontend/src/make/quiz-stats/quiz-stats-component.scss` — `.accuracy-pill` rules per band.
- `specs/features/take/quiz/Quiz.Stats.feature` — add the scenario below.
- `specs/src/pages/quiz-stats-page.ts` + `specs/src/steps/take/quiz/quiz-stats.ts` — a new step + locator to read a question row's accuracy band (`shows accuracy "X%" in the "Y" band`).

## 3. Acceptance scenarios

The colour is asserted through the `data-band` hook. One scenario covers all three bands (including the 50% boundary → `mid`).

```gherkin
Scenario: Per-question accuracy shows as a colour-coded pill
  Given workspace "Diagnostics" with questions
    | bookmark | question                      | answers                    |
    | Strong   | What is 2 + 2?                | 4 (*), 3, 5                |
    | Mixed    | What is the capital of Italy? | Rome (*), Naples, Florence |
    | Weak     | What color is the sky?        | Blue (*), Green, Red       |
  And quiz "Coloured Quiz" with all questions
  # Two attempts: "Strong" always right, "Mixed" half right, "Weak" always wrong
  When I start the quiz
  * I answer "4"
  * I answer "Rome"
  * I answer "Green"
  * I finish the quiz in 5 seconds
  When I start the quiz
  * I answer "4"
  * I answer "Naples"
  * I answer "Red"
  * I finish the quiz in 5 seconds
  When I open quiz "Coloured Quiz" statistics
  Then question "What is 2 + 2?" shows accuracy "100%" in the "high" band
  And question "What is the capital of Italy?" shows accuracy "50%" in the "mid" band
  And question "What color is the sky?" shows accuracy "0%" in the "low" band
```
