# Design — per-question accuracy heat pill

The **Correct** cell in the Question-level breakdown table shows the correct rate
as a rounded, colour-coded pill instead of plain text.

Open **`accuracy-pill.html`** in a browser to see it.

- Background + text colour by band: green ≥ 75%, amber 50–74%, red < 50%.
- Pill: `min-width:64px`, `padding:5px 12px`, `border-radius:999px`, bold, tabular numerals.

The implementation spec (formula, exact hex, files, BDD) lives in
`../../question-accuracy-colours.md`.
