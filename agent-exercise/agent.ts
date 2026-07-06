/**
 * agent.ts — run the exploratory-testing agent with the Claude Agent SDK.
 *
 * The SDK owns the agentic loop: you call query() once, and Claude decides which
 * tour to run, calls get_tour_charter to load it, then drives the browser via the
 * Playwright MCP server to explore — looping against what it observes until the
 * charter's stop condition is met. You just consume the streamed messages.
 *
 * Two MCP servers are wired in:
 *   1. charterServer   — our in-process tool server (get_tour_charter, list_...,
 *                        finish_charter, which captures the final report)
 *   2. Playwright MCP  — gives Claude real browser control to run the tour
 *
 * Requires: @anthropic-ai/claude-agent-sdk, plus the Playwright MCP server
 * (npx @playwright/mcp) available on the machine.
 */

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { charterServer, playwrightServer } from "./tools.js";
import { session, type ReportDraft } from "./charterStore.js";

const here = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// System prompt: tells the agent how to run one tour per session.
// ---------------------------------------------------------------------------

const TARGET_URL = "http://localhost:5173/";

const SYSTEM_PROMPT = `You are an exploratory testing expert that runs one Whittaker-style tour per session.
Each tour has a mission. Explore the product with the stated mission.
Test only through the UI, as a real user would.
When something is unclear, missing, misleading, or unavailable in the UI, treat that as a finding. 
Do not try to determine how the feature is “meant” to work internally. Test only how it actually behaves for the user.` +

// EXTEND the prompt if needed to satisfy your needs. Consider: stop conditions, reporting formats, process guidance.

`ALWAYS end by calling finish_charter with the complete report as JSON in the
required report format — even when you stop early. If you stopped before the
Goal, say so in coverage_notes and report what was and was not covered. The
report is only saved when finish_charter runs.

System under test: Quizmaster at ${TARGET_URL} (build: current dev).
Always start by navigating there.`;

// ---------------------------------------------------------------------------
// The tools THIS agent is allowed to call, without asking: the charter tools
// (names imported from ./tools so this list can't drift from what exists) plus
// the browser tools. This is agent policy — it sits here with disallowedTools
// and permissionMode below, not in the tools file.
// (Playwright tool names depend on the installed @playwright/mcp version —
// check them with /mcp and adjust if needed.)
// ---------------------------------------------------------------------------

const ALLOWED_TOOLS = [
  "mcp__charters__get_tour_charter",
  "mcp__charters__list_tour_charters",
  "mcp__charters__finish_charter",
  "mcp__charters__record_findings",
  "mcp__charters__record_defects",
  "mcp__playwright__browser_navigate",
  "mcp__playwright__browser_click",
  "mcp__playwright__browser_type",
  "mcp__playwright__browser_snapshot",
  //"mcp__playwright__browser_take_screenshot",
  "mcp__playwright__browser_console_messages",
  "mcp__playwright__browser_network_requests",
];

// ---------------------------------------------------------------------------------------------
// Run one tour. The SDK drives the loop; we just print what streams back.
// User prompt is the run context: Provide info about feature_scope, known_risks, documentation.
// ---------------------------------------------------------------------------------------------

export async function runTour(userPrompt: string): Promise<ReportDraft> {
  // All the run options in one place.
  const options = {
    model: "claude-opus-4-8", //"claude-sonnet-5",
    systemPrompt: SYSTEM_PROMPT,
    maxThinkingTokens: 3500, // max tokens for the agent's internal reasoning
    cwd: here, // for relative paths in the charter tools
    
    // Stop rules so an unreachable mission can't run forever.
    maxTurns: 30, // A “turn” is roughly: Claude thinks, call a tool, tool result comes back, Claude continues.
    maxBudgetUsd: 1, //USD

    // Consider adding hooks for preventing context rot.

    // The two MCP servers the agent can use.
    mcpServers: {
      charters: charterServer,
      playwright: playwrightServer,
    },

    allowedTools: ALLOWED_TOOLS, // tools Claude may use automatically, without asking for permission. All others require explicit permission.
    disallowedTools: ["Write", "Edit", "Bash"],  // tools Claude may never use, even with permission. These are dangerous for security and safety.
    permissionMode: "dontAsk" as const, // how much Claude must ask for permission before using tools.
  };

  // Start the agent. query() returns a stream of messages.
  const response = query({
    prompt: userPrompt,
    options: options,
  });

  // Read each message as it arrives and print it.
  for await (const message of response) 
  {
    if (message.type === "assistant") 
    {
      const blocks = message.message.content;
      for (let blocksIndex = 0; blocksIndex < blocks.length; blocksIndex++) 
      {
        const block = blocks[blocksIndex];
        if (block.type === "text") { console.log(block.text); } 
        else if (block.type === "tool_use") { console.log("  -> tool: " + block.name); }
      }
    } 
    else if (message.type === "result") 
      { console.log("\n[done: " + message.subtype + "]"); }
  }

  // The report is built incrementally in the shared session; finish_charter marks
  // it complete. It may be a partial draft if the tour stopped before finishing.
  if (session.finished)
    { console.log("\n=== FINAL REPORT === written to file by finish_charter ===\n");  } 
  else 
    { console.log("\n[report incomplete — finish_charter was not called]");}

  return session.report;
}

// ---------------------------------------------------------------------------
// Entry point. The mission comes from the CLI; the target URL and build are
// fixed (see SYSTEM_PROMPT). Example:
//
//   pnpm run-tour "Run the Rained-Out tour."
// ---------------------------------------------------------------------------

const mission = process.argv.slice(2).join(" ");
if (!mission) {
  console.error('Usage: pnpm run-tour "<mission, e.g. Explore <area, feature, risk> to discover <information>>"');
  process.exit(1);
}
await runTour(mission);