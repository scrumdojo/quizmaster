# How to develop Quizmaster

<!-- markdownlint-disable MD051 -->

- [Running Quizmaster](#🚀-running-quizmaster)
- [Running Vite dev server](#running-vite-development-server)
- [Running end-to-end tests](#🧪-running-end-to-end-tests)
- [Feature flag](#🚩-feature-flag)
- [AI Assistant](#🤖-ai-assistant)

## First-time setup

Install dependencies, Chromium browser for E2E tests, and create a default `.env` configuration:

```sh
pnpm install:all
```

For a host-local Linux setup with system Chromium installed, use the local developer setup
wrapper instead:

```sh
pnpm dev:setup
```

This keeps the normal package installs but skips the Playwright browser download when
`chromium` is available on `PATH`. The local developer scripts default database connection
values to `DB_HOST=localhost`, `DB_NAME=quizmaster`, `DB_USER=quizmaster`, and
`DB_PASS=quizmaster` unless those variables are already set. When using system Chromium,
they also set `PLAYWRIGHT_VIDEO=off` to avoid requiring Playwright's bundled `ffmpeg`.

## 🚀 Running Quizmaster

### Start Quizmaster

The following command rebuilds the frontend and starts Quizmaster:

```sh
pnpm start
```

> **No host JDK/Postgres?** See [Quick run in Docker](container.md#quick-run-in-docker-no-host-jdkpostgres)
> for a Docker-only launcher (`.claude/skills/run-app/`) that also runs the E2E suite in containers.

### Run backend tests

```sh
pnpm test:be
```

This runs **all** backend tests, including AI integration tests that call a real LLM (requires `OPENROUTER_API_KEY`).

To run only a subset:

- `pnpm test:be:local` — local tests only (no API key needed)
- `pnpm test:be:ai` — AI integration tests only (requires `OPENROUTER_API_KEY`)

AI tests are tagged with JUnit 5 `@Tag("ai")`. When `OPENROUTER_API_KEY` is not set,
AI tests are skipped automatically via `assumeTrue`.

### Code quality

Run before committing:

```sh
pnpm code
```

This runs TypeScript type checking, oxlint, and oxfmt on the frontend, specs, and mcp packages.

<!-- markdownlint-disable-next-line MD045 MD033-->
## <img alt="Vite logo" src="https://vitejs.dev/logo.svg" height="20"> Running Vite Development Server

For frontend development with hot module replacement, start both the backend and Vite dev server:

```sh
pnpm start
```

This runs the backend on `http://localhost:$BE_PORT` and the Vite dev server on `http://localhost:$FE_PORT`.

Default ports are `BE_PORT=8080` (backend) and `FE_PORT=5173` (Vite), configurable in `.env`.

Vite proxies API requests to the backend and reloads the browser automatically on frontend changes.

The host-local wrapper sets the same localhost defaults and then delegates to `pnpm start`:

```sh
pnpm dev:run
```

## 🧪 Running end-to-end tests

Run [Cucumber](https://cucumber.io/docs/guides/) + [Playwright](https://playwright.dev/) end-to-end tests:

```sh
pnpm test:e2e
```

This builds the frontend, starts the backend, runs all E2E specs, and stops the backend.
By default it resets Quizmaster app data in the configured database before the standalone
test run so E2E records do not accumulate. Set `E2E_RESET_DB=0` to keep existing data.

For development, with backend and Vite already running via `pnpm start`:

- `pnpm test:e2e:dev` — run tests against the Vite dev server
- `pnpm test:e2e:ui` — open Playwright UI at `http://localhost:3333`

These running-server modes do not reset the database unless you explicitly set
`E2E_RESET_DB=1`.

For a CI-like local development gate, run:

```sh
pnpm dev:gate
```

It runs TypeScript/lint/format checks, MCP tests, a production frontend build, backend tests,
and the Cucumber/Playwright E2E suite with `FEATURE_FLAG=true`. It defaults to
`PW_WORKERS=1` for host-local stability; set `PW_WORKERS` yourself if you want a faster run.
Because the gate runs the standalone E2E command, it also resets app data before the E2E phase.

To reset app data manually while keeping the migrated schema:

```sh
pnpm dev:reset-db
```

## 📊 Code coverage

- `pnpm coverage:be` — runs unit tests with JaCoCo and writes the merged backend report to `site/coverage/backend/`.
- `pnpm coverage:e2e` — runs the full E2E suite with both FE (c8/monocart) and BE (JaCoCo) instrumentation. FE report lands at `site/coverage/frontend/`, BE merged report (unit + E2E exec data) at `site/coverage/backend/`.

## Swagger UI ###
For easier testing, Swagger UI is available at `http://localhost:<BE_PORT>/swagger-ui/index.html` (default port `8080`).

## 🚩 Feature Flag

Hide an unfinished feature behind a feature flag. It will be hidden in production builds,
but runs in end-to-end tests in GitHub Actions CI/CD build.

- on the frontend, the feature flag is a global constant `FEATURE_FLAG_ENABLED`

    ```typescript
    if (FEATURE_FLAG_ENABLED) {
        // Unfinished feature
    }
    ```

- on the backend, the feature flag is a static method `FeatureFlag.isEnabled()`

    ```java
    import cz.scrumdojo.quizmaster.config.FeatureFlag;

    if (FeatureFlag.isEnabled()) {
        // Unfinished feature
    }
    ```

- in specifications, mark scenario with @feature-flag that pass only when feature flag is enabled

    ```gherkin
    @feature-flag
    Scenario: Unfinished scenario
        # Passes only when feature flag is set
    ```
- in specifications, mark scenario with flag @not-feature-flag that pass only when feature flag is disabled

    ```gherkin
    @not-feature-flag
    Scenario: Former scenario
        # Passes only when feature flag is not set (i.e. is false)
    ```

### Enable Feature Flag

To enable the feature flag, set the `FEATURE_FLAG` environment variable to `true`.

- Enable feature flag and start Quizmaster:

    ```bash
    export FEATURE_FLAG=true
    pnpm start
    ```

- Run end-to-end tests with feature flag enabled

    ```bash
    export FEATURE_FLAG=true
    pnpm test:e2e
    ```

Note: on Windows set the feature flag with `$env:FEATURE_FLAG="true"` command.

## 🤖 AI Assistant

Question generation uses [OpenRouter](https://openrouter.ai/) to call an LLM.

**In Codespaces**, the API key is provided automatically — no setup needed.

**In local/container environments**, add your key to `.env`:

```
OPENROUTER_API_KEY=sk-or-...
```

To use a different model, change `OPENROUTER_MODEL` in `.env` (default: `openai/gpt-4o-mini`).

To cap how many tokens each AI request may generate, set `OPENROUTER_MAX_TOKENS`
in `.env` (default: `8192`). The cap exists because some models default to a
much larger budget (65k+) which can exceed your OpenRouter credit balance and
fail every request with HTTP 402. Question generation responses are typically
under 1000 tokens, so 8192 has comfortable headroom; lower it if your balance
is tight, raise it if you start generating richer content.

### Recommended models

| Model | Notes |
|---|---|
| `openai/gpt-4o-mini` | Default — fast and cheap, but lower quality |
| `anthropic/claude-sonnet-4` | Strong reasoning, good at nuanced distractors |
| `openai/gpt-4o` | Well-rounded, reliable structured output |
| `google/gemini-2.5-flash` | Fast, good quality-to-cost ratio |
| `deepseek/deepseek-v3-0324` | Capable and cost-effective |
