# Quizmaster Domain Language

## Roles

A **Quiz maker** is an author. They create and edit [workspaces](#workspace),
[questions](#question), and [quizzes](#quiz), and review statistics across
past [attempts](#taking-a-quiz-attempt) to see which questions were answered
well and which need to be improved.

A **Quiz taker** is a learner. They open a quiz, work through it, and see their
score. Takers do not author content.

## Workspace

A **Workspace** is the top-level container — every [question](#question) and
every [quiz](#quiz) belongs to exactly one workspace. Workspaces have a title
and exist to group related material, for example one workspace per training
course.

## Question

A **Question** tests a learner's knowledge of a single topic. Every question
belongs to a [workspace](#workspace).

Questions come in three **types**:

- **Single-choice** — exactly one of the listed answers is correct.
- **Multiple-choice** — at least two answers are correct; possibly all of them.
- **Numerical** — the learner enters a number; the question stores one expected
  value and an optional **tolerance** so close-enough answers count as correct.

A multiple-choice question marked as **easy** displays the actual number of
correct answers to the [quiz taker](#roles).

Each question carries the prompt text, optional **image**, and the list of **answers**, which of those
answers are **correct**, and two kinds of feedback:

- A per-answer **explanation** shown next to each answer when the learner sees
  results.
- A single **question explanation** shown below the answers, used for context
  that applies to the question as a whole.

[Quiz maker](#roles) can organize questions in their workspace using optional
**tags**.

## Quiz

A **Quiz** is a curated set of [questions](#question) from one
[workspace](#workspace), configured for [takers](#roles) to work through. It
carries a title, an optional description, a question list, and optional
**cohorts** used to group takers under the same quiz.

Two settings shape _how_ takers experience the quiz:

- **Mode** is **Exam**, **Learning**, or **Buzzer**.
    - In **Exam mode**, submitting an answer immediately moves to the next
      question. The taker sees no feedback or explanations until the whole quiz
      is finished, and the final score and feedback appear once at the end.
    - In **Learning mode**, feedback and explanations appear after each answer,
      and the taker advances manually. Learning quizzes can be retaken.
    - In **Buzzer mode**, exactly two cohorts race each other: each cohort
      joins as one shared attempt, and once the second cohort joins, a
      10-second countdown starts. When it ends, question 1 appears to both
      cohorts at the same time.

- **Difficulty** is **easy**, **hard**, or **keep**. _Easy_ and _hard_ override
  each question's own easy mark at quiz time so the taker sees a uniformly
  easier or harder variant; _keep_ respects whatever each question itself
  declares.

Each question in a quiz can have a **weight** (1–5, default 1) that controls how
many points it contributes to the final score. Weights are set per quiz
inclusion — the same question can carry different weights in different quizzes.
The **weighted score** is the sum of each question's point value multiplied by
its weight. The **score percentage** is `weightedPoints / totalWeight × 100`.
Pass/fail uses this percentage. The unweighted question count ("Points X / Y")
is also shown separately for reference.

From the quiz **Share** screen, a maker can open **Live stats** when the quiz
has cohorts. The panel ranks cohorts by the sum of weighted points earned so
far across all non-dry-run attempts in each cohort, including in-progress runs.
Each answered question contributes its outcome points (1 for correct, 0.5 for
partial) multiplied by that question's weight in the quiz.

Three settings shape _which_ questions appear and _when_:

- **Pass score** is the percentage a taker must reach (weighted) to pass.
- **Time limit** is the maximum time allowed to complete the quiz. When time
  runs out the quiz is auto-submitted and scored.
- **Random question count** limits the quiz to N randomly drawn questions from
  the question list. Unset means use all questions.

A quiz can also be **scheduled** with start and end times that bound when it is
available to takers.

## Poll

A **Poll** is a single-question survey that belongs to exactly one
[workspace](#workspace). Unlike a [question](#question), a poll is intended for
quick opinion gathering rather than scoring.

A poll contains:

- One **question** text.
- A list of **answers** from which a learner selects exactly one option. Each
  answer has its own backend-generated id and an image URL, an answer text,
  or both — at least one of the two is required.

The backend supports creating, editing, deleting, and listing polls through
workspace-scoped authoring API. Editing keeps collected votes for answers
that survive the edit; removed answers lose their votes and new answers
start at zero. Deleting a poll discards its votes. The public take API lets a voter fetch
the poll question and answer ids by poll id and then submit an anonymous vote
using the selected answer's id. Poll definitions are stored in PostgreSQL
(`poll` and `poll_answer` tables); votes are stored as an aggregate counter per
answer, incremented atomically on each submission. The author can
fetch aggregated results for a poll through a workspace-scoped results
endpoint; the response contains every answer with its id, text, and current
vote count, including answers that still have zero votes.

## Taking a quiz: Attempt

An **Attempt** records one [taker](#roles)'s run through a [quiz](#quiz). It
captures which quiz and which questions were drawn (important under random
selection, because two attempts on the same quiz can see different question
subsets), an optional selected cohort from that quiz, an optional taker-chosen
nickname, when it started, and when it finished or timed out.

The score is broken down three ways: fully **correct** answers, **partially
correct** answers (a multiple-choice question where the learner picked some
but not all correct options), and **incorrect** answers.

An attempt has a status: **in-progress**, **finished**, **timeout** (timed out
but evaluated), or **abandoned** (timed out without evaluation).

An attempt can be flagged as a **dry run**: an author preview of their own
quiz. Dry-run attempts bypass the quiz's availability window and are excluded
from quiz statistics. Otherwise they behave identically to a regular attempt
(same per-question submission, evaluation, and timeout pipeline).

While taking a quiz, several affordances are available:

- **Skip** leaves the current question unanswered and moves on. Skipped
  questions can be revisited.
- **Bookmark** marks a question to return to later, useful when the taker
  wants to come back after seeing later questions.
- **Flag** marks a question as problematic (confusing or ambiguous). The flag
  is recorded on the attempt's drawn question, can be toggled off, and is
  isolated per attempt — a new attempt starts with nothing flagged. Flagging
  never affects answering, navigation, or scoring; flag counts are aggregated
  per question and surfaced to the author in quiz statistics.

## AI assistance: Robin AI

[Quiz makers](#roles) converse with **Robin AI** to draft
[questions](#question). In a single chat the maker can ask for any number of
questions of any type, mixed — Robin infers each question's type from the
request; there is no type selector. Asking for a change appends a **new draft
version** while every earlier version stays visible and usable. Robin only
drafts; the maker reviews and then uses a draft to fill the question form, or
saves drafts (one or all) straight into the workspace. A draft that is too
similar to an existing question in the same workspace is not shown — Robin
says so in the chat, and the maker refines the request in the next message.
The conversation is ephemeral: closing the assistant discards it.

## Explanation chat

Wherever a [question](#question)'s explanation is shown to a
[quiz taker](#roles) — a learning-mode quiz question or a standalone
question — an expandable chat underneath lets the taker ask a free-form
follow-up question about it: an unfamiliar term, a deeper explanation, a
concrete example, or an alternative explanation (e.g. a comparison). The chat
already knows the question, the taker's given answer, and the explanation, so
the taker never has to repeat any of it.

The chat stays bounded to that question's topic: an unrelated question is not
answered on its own terms, and the AI instead steers the taker back to the
topic without ending the conversation, so a later on-topic question still
gets a normal, helpful reply. The AI mirrors the taker's tone and language,
except when the taker is rude or unfriendly — then it stays neutral and
friendly instead of escalating.

The conversation persists only while the question stays active (surviving a
collapse/re-expand of the chat); it starts empty again once the taker
re-answers the question or begins a new attempt.

---

## Alphabetical index

| Term                  | See                                      |
| --------------------- | ---------------------------------------- |
| Abandoned             | [Attempt](#taking-a-quiz-attempt)        |
| Answer                | [Question](#question)                    |
| Attempt               | [Attempt](#taking-a-quiz-attempt)        |
| Bookmark              | [Attempt](#taking-a-quiz-attempt)        |
| Correct answer        | [Question](#question)                    |
| Difficulty            | [Quiz](#quiz)                            |
| Easy                  | [Question](#question), [Quiz](#quiz)     |
| Exam mode             | [Quiz](#quiz)                            |
| Explanation chat      | [Explanation chat](#explanation-chat)    |
| Explanation           | [Question](#question)                    |
| Finished              | [Attempt](#taking-a-quiz-attempt)        |
| Image                 | [Question](#question)                    |
| In-progress           | [Attempt](#taking-a-quiz-attempt)        |
| Learning mode         | [Quiz](#quiz)                            |
| Multiple-choice       | [Question](#question)                    |
| Numerical             | [Question](#question)                    |
| Partially correct     | [Attempt](#taking-a-quiz-attempt)        |
| Pass score            | [Quiz](#quiz)                            |
| Poll                  | [Poll](#poll)                            |
| Question              | [Question](#question)                    |
| Question explanation  | [Question](#question)                    |
| Question list         | [Quiz](#quiz)                            |
| Quiz                  | [Quiz](#quiz)                            |
| Quiz maker            | [Roles](#roles)                          |
| Quiz taker            | [Roles](#roles)                          |
| Random question count | [Quiz](#quiz)                            |
| Robin AI              | [AI assistance](#ai-assistance-robin-ai) |
| Schedule              | [Quiz](#quiz)                            |
| Single-choice         | [Question](#question)                    |
| Skip                  | [Attempt](#taking-a-quiz-attempt)        |
| Tags                  | [Question](#question)                    |
| Time limit            | [Quiz](#quiz)                            |
| Timeout               | [Attempt](#taking-a-quiz-attempt)        |
| Tolerance             | [Question](#question)                    |
| Workspace             | [Workspace](#workspace)                  |
