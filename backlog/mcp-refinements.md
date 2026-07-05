# MCP server — small refinements

> Trimmed 2026-07-05: the AI-draft items (excludedQuestionId plumbing, `tags`
> noise in drafts) became moot when the AI drafting tool was removed from MCP
> and `QuestionDraft` gained optional `isEasy`/`tags`.

## Issues

### Over-eager `health()` fallback

`QuizmasterClient.health()` falls back to `GET /` when `/api/feature-flag` returns 404.
The only case where this triggers is "backend up, feature-flag endpoint renamed" — vanishingly
rare and recoverable by editing one line. If the backend is unreachable, both calls fail
and you get `reachable: false`, which is the only actionable signal. Drop the branch.

## Files in scope

- `mcp/src/quizmaster-client.ts`
- `mcp/test/quizmaster-client.test.ts`
