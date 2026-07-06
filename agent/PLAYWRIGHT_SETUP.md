# Agent setup — Playwright MCP

The exploratory-testing agent ([agent.ts](agent.ts)) drives a browser through the
**Playwright MCP** server, spawned as a stdio subprocess:

```ts
// agent.ts
const playwrightServer = {
  type: "stdio" as const,
  command: "npx",
  args: [
    "@playwright/mcp@0.0.77",
    "--headless",
    "--config",
    join(here, "playwright-mcp.config.json"),
  ],
};
```

For this to work the machine needs four things:

1. The `agent/` package dependencies installed.
2. `@playwright/mcp` fetchable by `npx` (network the first time, or pre-cached).
3. The **chromium build that the MCP's bundled `playwright-core` expects** —
   this is version-specific and is the part that usually bites.
4. The MCP told to **use that bundled Chromium** rather than its default `chrome`
   channel — done via [playwright-mcp.config.json](playwright-mcp.config.json)
   (`browserName: "chromium"`), passed with `--config`. Without this the MCP looks
   for a system Google Chrome at `/opt/google/chrome/chrome` and fails to launch.

Run the steps below once on a fresh machine. They are idempotent; re-running is safe.

---

## 0. Prerequisites

- Node.js ≥ 18
- `pnpm` (repo uses it) and `npx`
- Network access for the first run (downloads the MCP package + ~290 MB of browser)

## 1. Install the agent package deps

```bash
cd agent
pnpm install
```

Installs `@anthropic-ai/claude-agent-sdk`, `zod`, and the SDK's peers. Typecheck to confirm:

```bash
pnpm tsc      # expect exit 0, no errors
```

## 2. Pre-cache the Playwright MCP

Warms the `npx` cache so the agent can start even if the network is later unavailable:

```bash
npx @playwright/mcp@0.0.77 --version    # prints "Version 0.0.77"
```

> **Why pinned to `0.0.77`, not `@latest`:** each MCP build bundles a specific
> `playwright-core`, which in turn pins an exact chromium **revision**. Using
> `@latest` means a future `npx` run can silently pull a newer MCP that wants a
> different chromium revision — re-breaking the browser (see step 3). The version
> is pinned in [agent.ts](agent.ts); keep this doc's version in sync with it.

## 3. Install the matching chromium build

The MCP's `playwright-core` looks for one **exact** chromium revision in
`~/.cache/ms-playwright`. The repo's `specs/` package installs a different
(older) revision, so the browser present for the E2E suite is **not** the one the
MCP needs. Install chromium using the MCP's own `playwright-core` so the correct
revision lands:

```bash
# Locate the playwright-core CLI inside the freshly-cached MCP:
PWCLI=$(find ~/.npm/_npx -path "*playwright-core/cli.js" | head -1)

# Download the chromium revision this playwright-core pins:
node "$PWCLI" install chromium
```

At the time of writing this pulls **chromium v1229** (Chrome for Testing
150.0.7871.24) plus its headless shell. The `npm install ... playwright` warning
it prints is expected and harmless — we are intentionally driving `playwright-core`
directly, not a project install.

## 4. Verify

```bash
# The expected revision should be present:
ls ~/.cache/ms-playwright | grep 1229
# -> chromium-1229
#    chromium_headless_shell-1229
```

If a future MCP bump changes the required revision, re-run step 3; the expected
number is discoverable via:

```bash
PWCORE=$(find ~/.npm/_npx -type d -path "*playwright-core" | head -1)
grep -A5 '"name": "chromium"' "$PWCORE/browsers.json" | grep revision
```

---

## Troubleshooting

- **`Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`** —
  the MCP is defaulting to the `chrome` channel (system Google Chrome) instead of
  the bundled Chromium. Ensure `--config playwright-mcp.config.json` is passed and
  that the file sets `browser.browserName` to `"chromium"`. The `--browser` CLI
  flag can **not** express this — its only values are `chrome/firefox/webkit/msedge`,
  none of which is plain Chromium; the config file is the only way.
- **`No usable sandbox!` (FATAL … zygote_host_impl_linux.cc) at browser launch** —
  the container has unprivileged user namespaces disabled, so Chromium can't
  sandbox itself. Ensure [playwright-mcp.config.json](playwright-mcp.config.json)
  sets `browser.launchOptions.chromiumSandbox` to `false` (and `args: ["--no-sandbox"]`).
  This weakens browser isolation and is acceptable only for a test harness driving a
  trusted local dev app — do **not** carry it into a context that browses untrusted content.
- **`Executable doesn't exist … run npx playwright install`** at browser launch —
  the chromium revision on disk doesn't match what the MCP wants. Redo step 3.
- **`npx` hangs / fails offline on first run** — the MCP package isn't cached.
  Run step 2 once while online.
- **Tool names don't match** (`mcp__playwright__browser_*` in [agent.ts](agent.ts)) —
  they depend on the installed MCP version. If you change the pin, verify the tool
  names the server exposes and update the `allowedTools` list accordingly.

## Runtime

The agent also needs `ANTHROPIC_API_KEY` in the environment:

The target URL (`http://localhost:5173/`) and build are fixed in
[agent.ts](agent.ts); you only pass the mission:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
cd agent && pnpm run-tour "...information about what you want it to focus on ...."
```
