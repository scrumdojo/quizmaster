# Quizmaster — Product Overview

## Summary

Quizmaster is a lightweight authoring and assessment tool built for the
trainers at ScrumDojo.cz. Trainers prepare Scrum workshops and need a
fast way to (1) build pools of reusable questions, (2) assemble quizzes
from them for a specific class or cohort, and (3) see how their
trainees did. Trainees pick up a link, work through the quiz in a
browser, and get scored — no account required.

Two roles drive the product:

- **Quiz makers** — trainers and content authors who create and curate
  workspaces, questions, and quizzes, and review attempt statistics.
- **Quiz takers** — workshop participants who follow a link to take a
  quiz or a single question.

An AI co-pilot ("Robin AI") helps the maker draft questions from a
short prompt instead of typing them by hand. The same content can also
be managed by AI clients via a Model Context Protocol (MCP) server,
which exposes Quizmaster's authoring surface to tools such as Claude
Desktop.

## Main features

### Authoring (maker side)

- **Workspaces** — top-level folders that group everything for one
  course; questions and quizzes live inside exactly one workspace.
- **Questions** with three types:
    - _Single-choice_ — exactly one right answer.
    - _Multiple-choice_ — two or more right answers; an optional "easy"
      mark reveals the count of correct answers to the taker.
    - _Numerical_ — a typed number, with an optional tolerance band.
      Questions can carry an image (via URL), a single tag, per-answer
      explanations, and a question-level explanation.
- **Quizzes** assembled by picking questions from the workspace, with:
    - _Exam_ vs _Learning_ mode (end-of-quiz feedback vs. after each
      answer; learning mode allows retakes).
    - _Difficulty_ override (easy / hard / keep per-question setting).
    - _Pass score_, _time limit_, optional _random subset_ of N
      questions, and an optional _availability window_ (start/end
      dates).
- **Cohorts** — per-quiz groupings with their own shareable link, used
  to track a class or team separately on the cohort leaderboard.
- **Dry run** — maker preview of their own quiz that bypasses the
  schedule and is excluded from stats.
- **Statistics** — attempt-by-attempt table (duration, points, score,
  status: in-progress / finished / timeout / abandoned) plus
  per-question success rates and how often each question was flagged
  as problematic.

### Taking (learner side)

- **Welcome page** with quiz description, question count, time limit,
  pass score, feedback mode, and cohort leaderboard if applicable.
- **In-quiz navigation** — countdown timer, progress bar, back/next,
  skip (revisited later), bookmark, flag-as-problematic, browser
  back/forward, numeric-key shortcuts (1–9) for choice questions.
- **Per-answer feedback** with color coding and explanations; partial
  credit for multi-choice; tolerance-aware grading for numerical.
- **Final score page** with the user's selections, correct answers,
  and explanations for review.
- **Standalone question taking** — open a single question outside any
  quiz, useful for quick checks.

### AI assistance (Robin AI)

- Draft a single question from a topic, with answers and explanations
  pre-filled; works for single, multiple-choice, and numerical types.
- Generate multiple questions in one batch directly from the workspace
  chat (saved only after the maker confirms; works for prompts in
  English and Czech).
- Edit-with-context: when the maker is already editing a question,
  Robin uses the current form state (including unsaved edits) as input.
- Restore previous AI-generated version (history within a session).
- **Duplicate avoidance** — Robin refuses to save a draft that is too
  similar to an existing question in the same workspace.

### MCP server

- Exposes workspaces, questions, quizzes, stats, and AI drafting as
  Model Context Protocol tools, resources, and prompts.
- Enables AI clients (Claude Desktop, etc.) to act as a third "maker
  channel" alongside the web UI.

## Gaps and refinements

- **No authentication or accounts.** There is no login. Anyone with a
  workspace or quiz URL has full control (or full taking access). All
  authorization scenarios (viewers/editors/owners, membership,
  cohort-link gating) are specified but skipped — security is a
  pending foundation, not an existing one.
- **Taker identity is anonymous.** Attempts are not linked to a person,
  so there is no login-backed learner history, no "your weak areas," and no
  spaced repetition. A taker may enter a nickname when starting a quiz, but it
  remains a display label rather than an account identity. Leaderboards are
  still cohort-aggregate today.
- **No team / multi-workspace sharing.** A workspace belongs to
  whoever has its URL. Questions cannot be moved or copied between
  workspaces; there is no shared question bank.
- **No bulk content operations.** No import (CSV, JSON, Markdown), no
  export, no duplication of a question or a quiz. Building a workspace
  is hand-entry or one-question-at-a-time AI drafting.
- **Cohort management is write-only.** Cohorts can be created but not
  renamed, reordered, or deleted from the share screen.
- **Tags are minimal.** One optional tag per question; no
  multi-tagging, no tag hierarchy, no tag-based stats.
- **Images are URL-only.** No upload or hosting; the maker must put
  the image on a public URL elsewhere.
- **Single-language UI.** App chrome is in English; content and AI
  prompts can be any language, but there's no localisation framework.
- **Stats are descriptive, not diagnostic.** Raw attempt and
  per-question numbers exist, but there's no time-on-question,
  difficulty calibration, item analysis, or comparison across quizzes.
- **Robin AI is question-only.** It does not draft a whole quiz,
  generate or refine explanations for existing questions in bulk,
  suggest tags, or recommend which questions to add to a quiz.
- **No notifications or scheduling helpers.** No email reminders for
  cohort starts, no nudges after a missed timeout, no "your quiz is
  available" announcements.
- **No public catalogue.** Quizmaster is a tool for makers who know
  their audience; there is no discovery, marketplace, or community
  layer around shared content.
