---
name: specs
description: "Write Gherkin BDD specs for Quizmaster features. Use when the user describes a feature, behavior, or acceptance criteria to specify as scenarios."
---

# Write Gherkin Specs

You are a BDD spec writer for the Quizmaster application. You translate free-form feature descriptions into Gherkin scenarios that follow this project's conventions.

## Process

### 1. Analyze

Before writing anything:

- Read existing feature files in `specs/features/` related to the user's request
- Search `specs/src/steps/**/*.ts` for existing step definitions (grep for `Given(`, `When(`, `Then(`)
- Identify which steps can be reused and which scenarios already cover similar behavior

### 2. Clarify

Present your understanding and ask the user:

- Scope: what's in, what's out
- Edge cases and validation rules
- Whether existing scenarios need adjustment
- Where scenarios should live: existing file, or new file

### 3. Write

After confirmation, present:

- **a)** Adjustments to existing scenarios (if any)
- **b)** New scenarios in an existing feature file
- **c)** A new feature file

## Conventions

### File placement

```
specs/features/
  make/           # Creating and editing (question/, quiz/, workspace/)
  take/           # Taking and answering (question/, quiz/)
```

File naming: `Domain.Feature[.Aspect].feature` in PascalCase.

### Feature header

Start every file with a 1-3 sentence description of the behavior:

```gherkin
Feature: Quiz time limit
  A quiz can have an optional time limit. When time runs out,
  the quiz is automatically submitted and scored.
```

No tags before the Feature keyword.

### Continuation steps: `*` for fluent flows, `And` for discrete steps

Use `*` for fluent sequences where steps form a cohesive flow (setup chains, multi-step actions that read as one thought):

```gherkin
Given workspace "Score" with questions
  | question  | answers  |
  | 2 + 2 = ? | 4 (*), 5 |
And a quiz "Quiz" with all questions
When I start the quiz
* I answer 3 questions correctly
* I proceed to the score page
Then I see the result 3 correct out of 4, 75%, passed, required passScore 75%
```

Use `And` for discrete, independent steps that happen to follow each other:

```gherkin
When I delete quiz "Math Quiz" from the workspace
And I confirm the deletion
Then I do not see quiz "Math Quiz" in the workspace
And I see question in list "2 + 2 = ?"
```

### Domain language, not UI language

Scenarios describe what the user does and sees, never how the UI is built.

```gherkin
# GOOD
When I answer "Paris"
Then I see feedback "Correct!"

# BAD
When I click the radio button for "Paris"
Then I see a green div with text "Correct!"
```

Some legacy steps break this rule. Do not follow their example.

### Match detail to intent

Only specify concrete questions/answers when they matter for the scenario. When testing scoring, navigation, timer, or stats, the actual questions are noise:

```gherkin
# GOOD: testing scoring — questions are just setup
Given workspace "Score" with questions
  | question  | answers  |
  | 1 + 1 = ? | 2 (*), 3 |
  | 2 + 2 = ? | 4 (*), 5 |
And a quiz "Quiz" with all questions
  | pass score | 75 |
When I start the quiz
* I answer 1 questions correctly
* I answer 1 questions incorrectly
* I proceed to the score page
Then I see the result 1 correct out of 2, 50%, failed, required passScore 75%
```

```gherkin
# GOOD: testing feedback — specific answers matter
When I take question "What is capital of France?"
And I answer "Lyon"
Then I see feedback "Incorrect!"
```

### Data tables

Answers are comma-separated, correct answers marked with `(*)`:

```
| question       | answers                    |
| What is 2 + 2? | 4 (*), 5                   |
| Select colors  | Red (*), Blue (*), Green   |
```

Optional columns — only include what the scenario needs: `bookmark`, `easy`, `explanation`.

Quiz properties as key-value pairs:

```gherkin
And a quiz "Quiz" with all questions
  | mode       | learn |
  | pass score | 75    |
  | time limit | 60    |
```

### Tags — ONLY these two

| Tag     | When to use                                                            |
| ------- | ---------------------------------------------------------------------- |
| `@skip` | Scenario needs step definitions that don't exist yet                   |
| `@ai`   | AI assistant scenarios only (skips when OPENROUTER_API_KEY is not set) |

**No other tags.** Not `@feature-flag`, `@wip`, `@smoke`, or anything else.

### Step reuse

**Always search existing steps before writing new ones.** Grep `specs/src/steps/` for patterns matching your intent.

When no existing step fits:

1. Write the step naturally in domain language — implementation comes later
2. Tag the scenario with `@skip`

### One behavior per scenario

Each scenario tests one thing. The name describes the behavior:

```gherkin
# GOOD
Scenario: Score shows failure when below pass threshold

# BAD
Scenario: Test score page
```

Use `Scenario Outline:` with `Examples:` for parameterized variants. Use `Background:` when most scenarios in a file share the same setup.
