---
description: Turn a fuzzy objective into a verifiable /goal completion condition using Tom Gilb's Planguage (Scale, Meter, Goal, Fail, and either Past or Stop). Produces a draft for review; does NOT run /goal.
argument-hint: <fuzzy objective, e.g. "make it fast">
---

Turn the following fuzzy objective into a verifiable completion condition for the
`/goal` command, using Tom Gilb's Planguage. Produce a draft for the human to
review — do NOT run `/goal` yourself.

Objective: $ARGUMENTS

## What to produce

A fuzzy objective like "make the homepage load faster" has no finish line: an
agent can't tell when it has won, when to give up, or whether it hit the target
in a useless way (e.g. deleting features to make a page "faster"). Planguage
fixes this by forcing the goal into named parameters. Produce **Scale, Meter,
Goal, Fail**, plus exactly ONE of **Past** or **Stop** — chosen by the goal type
(see below).

- **Scale** — the unit "done" is measured in (e.g. milliseconds, % of files,
  count of failing tests). Name the unit that best captures what the objective
  really wants; if several are plausible, pick the most decision-relevant one and
  note the alternatives.
- **Meter** — the exact command, test, or tool that reads a value on the Scale.
  It must be something a checker can actually run. If you don't know the real one
  for this project, state the assumption explicitly for the human to correct.
- **Goal** — the threshold on the Scale that ends the loop happily. Note the
  reasoning behind the target.
- **Fail** — the floor that must hold every cycle, regardless of progress toward
  the Goal. This is the critical parameter. Run the **lazy-solution test**: "what
  is the cheapest, most useless thing that technically satisfies this Goal as
  written?" Every cheat you can imagine becomes a clause in Fail. Always include
  the domain-obvious ones: don't delete or weaken the Meter, keep existing tests
  green, don't remove functionality to hit the number. Think of Goal as "get the
  number to X" and Fail as "…and no funny business getting there." Fail is checked
  every cycle — breaching it invalidates the run even if the Goal is met.

Then add EXACTLY ONE of these two, based on the goal type:

- **Past** — the current baseline on the Scale. Use Past for **relative-
  improvement goals**: the objective is to get *better* from where things are now
  ("make it faster", "reduce failures", "improve coverage"). Past grounds the
  Goal in reality and makes progress visible. If the baseline is unknown, write
  "to be measured" rather than inventing a number.
- **Stop** — the give-up bound (a cap on attempts, time, or cost). Use Stop for
  **absolute-threshold goals**: the objective is to reach a *fixed bar*
  regardless of the starting point ("all pages p95 < 2s", "zero critical
  vulnerabilities", "100% of endpoints return valid schemas"). There is no
  "improvement from baseline" to track — the target is absolute — but the loop
  still needs a bound so an unreachable absolute can't run forever. Stop answers
  "when do I give up, even if I haven't hit the bar?"

## Choosing Past vs Stop

Decide from the objective:

- If it asks to **improve on the current state** (better, faster, fewer, cleaner
  than now) -> use **Past**. The baseline is meaningful and progress is the point.
- If it asks to **meet an absolute standard** (every X under Y, zero Z, all of W
  passing) -> use **Stop**. The baseline is irrelevant to the target; what you
  need instead is a give-up bound so a possibly-unreachable absolute terminates.

If the objective is ambiguous, state which reading you chose and why, and mention
the other option so the human can switch.

## Output format

Use exactly this structure, including only the fifth line that applies (Past OR
Stop):

```
Quantified goal for: "<the original objective>"

  Scale:  <unit of measurement>
  Meter:  <exact command / test / tool that reads the Scale>
  Goal:   <threshold on the Scale that ends the loop — the win condition>
  Fail:   <floor(s) that must hold every cycle; the anti-cheat clauses>
  Past:   <current baseline, or "to be measured">      // relative-improvement goals
  — OR —
  Stop:   <give-up bound: max attempts / time / cost>  // absolute-threshold goals

Notes: <which fifth parameter you chose and why; assumptions; numbers to verify>
```

## Examples

**Relative-improvement goal (uses Past).** Objective: "make the homepage load faster"

```
Quantified goal for: "make the homepage load faster"

  Scale:  homepage load time, p95, in seconds (cold cache)
  Meter:  the performance suite's p95 homepage metric
          (assumption — confirm the real command for this project)
  Goal:   homepage p95 load time <= 2.0s
  Fail:   all existing tests stay green every cycle; do NOT hit the target by
          deleting features, removing images, or stripping content; do NOT
          weaken or bypass the performance test itself; the page must render the
          same content it does today.
  Past:   ~4.1s p95 today (assumption — measure before starting)

Notes: "faster" is relative improvement, so Past is used to ground the target and
show progress. p95 chosen over average so a few fast loads can't hide a slow tail.
```

**Absolute-threshold goal (uses Stop).** Objective: "get every page's p95 under 2 seconds"

```
Quantified goal for: "get every page's p95 under 2 seconds"

  Scale:  per-page p95 load time, in seconds (cold cache), across all pages
  Meter:  the performance suite run over every page; report the slowest page's p95
          (assumption — confirm the real command for this project)
  Goal:   every page's p95 load time <= 2.0s (i.e. max-page p95 <= 2.0s)
  Fail:   all existing tests stay green; do NOT hit the bar by deleting pages,
          removing content/images, or excluding slow pages from the measurement;
          do NOT weaken or bypass the performance test itself.
  Stop:   give up after 8 attempts or 60 minutes; then report the best max-page
          p95 reached and which pages still exceed 2.0s.

Notes: this is an absolute bar ("every page under 2s"), so Past is not meaningful —
the target does not depend on today's numbers. Stop is used instead so the loop
terminates even if some page cannot reach 2s; the report then names the holdouts.
```

## Finish

After the draft, tell the human: review it, adjust the numbers to the project's
reality, and run `/goal` with the Goal and Fail conditions (plus the Stop bound if
present) when satisfied. Do NOT run `/goal` — this command only drafts the
completion condition.
