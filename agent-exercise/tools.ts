/**
 * tools.ts
 *
 * What tools EXIST for the exploratory-testing agent:
 *   - the charter tools (below), bundled into an in-process MCP server, and
 *   - the Playwright MCP server config that gives Claude a real browser to drive.
 *
 * Which of these THIS agent is allowed to call is agent *policy*, not a tool
 * definition — that allow-list lives in agent.ts next to the other permission
 * settings.
 *
 *   - get_tour_charter   : fetch the full details of one tour to run
 *   - list_tour_charters : list all tours so the agent can choose one
 *   - finish_charter     : capture the final report (as JSON) and end the session
 *   - record_findings    : append a non-defect finding to the report
 *   - record_defects     : append a reproducible defect to the report
 *
 * Requires: @anthropic-ai/claude-agent-sdk, zod
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod"; // TypeScript library for schema validation
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import {
  TOUR_IDS,
  findTour,
  loadCharters,
  session,
  listTourSumaries,
  reportSchema,
  saveReport,
  OUTPUT_DIR,
  type TourReport,
} from './charterStore';

const here = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Tool 1: get_tour_charter
// ---------------------------------------------------------------------------

const getTourCharterName = "get_tour_charter";  // the name of the tool as the agent will call it

const getTourCharterDescription = // description of the tool for the agent to read and understand
  "Fetch the full details of an exploratory-testing tour charter to execute. " +
  "Call this once you have decided which tour to run. Returns the tour's mission, " +
  "focus, concrete agent actions, the stop conditions, the bug classes to look for, and output emphasis, " +
  "together with the shared testing preamble and the required final report format. " +
  "Run one tour per session — never combine tours. If unsure which tour fits, call " +
  "list_tour_charters first.";

const getTourCharterSchema = { // the schema for the tool's input, validated by zod,
  tour_id: z.enum(TOUR_IDS).describe("The id of the tour to run, e.g. 'landmark', 'supermodel', 'rained-out'."),
};

// the handler function for the tool, called by the agent with validated input
async function getTourCharterHandler( args: { tour_id: string;}) {
  const tour = findTour(args.tour_id);
  // If the id did not match any tour, return an error result.
  if (!tour) {
    const errorPayload = {
      error:'Unknown tour_id "' + args.tour_id + '". Call list_tour_charters for valid ids.',
      valid_ids: TOUR_IDS,
    };

    return { // SDK requirement to return an array of content items, each with a type and text
      content: [ { type: "text" as const, text: JSON.stringify(errorPayload) }, ],
      isError: true,
    };
  }

  // Build the reply: the chosen tour plus the report format. Universal testing
  // guidance lives in the agent's system prompt, not here.
  const testCharters = loadCharters();
  const tourCharter = {
    test_tour: tour,
    report_format: testCharters.report_format,
  };

  const tourCharterJson = JSON.stringify(tourCharter, null, 2);
  return { // SDK requirement to return an array of content items, each with a type and text
    content: [ { type: "text" as const, text: tourCharterJson }, ],
  };
}

// bundle the name, description, schema, and handler into a tool for the agent
export const getTourCharterTool = tool(
  getTourCharterName,
  getTourCharterDescription,
  getTourCharterSchema,
  getTourCharterHandler,
);

// ---------------------------------------------------------------------------------
// Tool 2: list_tour_charters | list all available tours so the agent can choose one
// This tool takes no input and returns a JSON array of tour summaries,
// each with a tour_id and a short description.
// ---------------------------------------------------------------------------------

"IMPLEMENT THIS TOOL: list_tour_charters" +
"Tool definition: name, description, input schema (none), and handler function" +
"Implement the list_tour_charters tool here, following the same pattern as get_tour_charter." +
"The handler should return a JSON array of tour summaries, each with a tour_id and a short description. " +
" Use the listTourSumaries function to get the data."

// ---------------------------------------------------------------------------
// Tool 3: finish_charter — capture the final report and end the session
// ---------------------------------------------------------------------------

const finishCharterName = "finish_charter";

const finishCharterDescription =
  "Call once the tour's mission is covered. Provide the complete report as JSON " +
  "in the required report format. This stores the report and ends the session.";

async function finishCharterHandler(args: { report: TourReport }) {
  session.finished = true;

  // saveReport merges the full report into the session draft and rewrites the file.
  const filePath = saveReport(args.report);

  return {
    content:
    [
      { type: "text" as const, text: `Charter finished. Report written to ${filePath}.` },
    ],
  };
}

export const finishCharterTool = tool(
  finishCharterName,
  finishCharterDescription,
  { report: reportSchema }, // the whole report arrives as one validated JSON object
  finishCharterHandler,
);

// ------------------------------------------------------------------------------------------
// Tool 4: record_findings - capture finding as we go to build the final report incrementally
// ------------------------------------------------------------------------------------------

const recordFindingsName = "record_findings";

export const recordFindingsTool = tool(
  recordFindingsName,
  "Record a non-defect finding: a product observation, a question for the team, or " +
  "a potential issue you could NOT confirm or reproduce. Do NOT use this for " +
  "reproducible defects — those go to record_defects with full evidence. " +
  "Call this immediately each time you find something, before continuing to " +
  "explore; do not batch findings or wait until the end. Each call appends to the " +
  "session report, so progress is saved even if the tour stops early.",
  {
    tour: reportSchema.shape.tour_summary.shape.tour_name, // validated against the tour_name schema
    finding: reportSchema.shape.key_findings, // validated against the key_findings schema
  },
  async (args) => {
    // Merge this slice into the session draft; saveReport rewrites the one file.
    const filePath = saveReport({
      tour_summary: { tour_name: args.tour },
      key_findings: args.finding,
    });
    return {
      content:
      [
        { type: "text" as const, text: `Finding recorded. Details written to ${filePath}.` },
        // add a Reminder to mitigate context rot.
      ],
    };
  },
);

// ------------------------------------------------------------------------------------------
// Tool 5: record_defect - capture defect as we go to build the final report incrementally
// ------------------------------------------------------------------------------------------

const recordDefectsName = "record_defects";

export const recordDefectsTool = tool(
  recordDefectsName,
  "Record a confirmed defect you can reproduce — a bug where the product behaves " +
  "incorrectly. Provide full detail: steps to reproduce, expected vs. actual " +
  "behavior, and at least one piece of evidence (screenshot path, console error, " +
  "or URL). Use this for ALL defects; do NOT also log the same defect with " +
  "record_findings. " +
  "Call this immediately each time you find a defect, before continuing to " +
  "explore; do not batch findings or wait until the end. Each call appends to the " +
  "session report, so progress is saved even if the tour stops early.",
  {
    tour: reportSchema.shape.tour_summary.shape.tour_name, // validated against the tour_name schema
    defect: reportSchema.shape.defect_details, // validated against the key_findings schema
  },
  async (args) => {
    // Merge this slice into the session draft; saveReport rewrites the one file.
    const filePath = saveReport({
      tour_summary: { tour_name: args.tour },
      defect_details: args.defect,
    });
    return {
      content:
      [
        { type: "text" as const, text: `Defect recorded. Details written to ${filePath}.` },
        // add a Reminder to mitigate context rot.
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// Bundle the tools into an in-process MCP server
// Standard way for agent to discover what tools exist, read their schemas, and invoke them.
// ---------------------------------------------------------------------------

export const charterServer = createSdkMcpServer({
  name: "exploratory-tour-charters",
  version: "1.0.0",
  tools: [getTourCharterTool, finishCharterTool, recordFindingsTool, recordDefectsTool],
});

// ---------------------------------------------------------------------------
// The Playwright MCP server: spawns a browser Claude can drive.
// ---------------------------------------------------------------------------

export const playwrightServer = {
  type: "stdio" as const,
  command: "npx",
  // Pinned (not @latest) so npx always resolves the same MCP build, which in
  // turn pins the required chromium revision. See PLAYWRIGHT_SETUP.md.
  // The config sets browserName: "chromium" so the MCP uses the bundled
  // Chromium, not the default "chrome" channel (which needs a system Google
  // Chrome install at /opt/google/chrome/chrome that we don't have).
  args: [
    "@playwright/mcp@0.0.77",
    "--headless",
    "--config",
    join(here, "playwright-mcp.config.json"),
    // Write screenshots, traces, page snapshots, and console logs into a
    // dedicated .playwright/ subdir so they don't clutter the reports dir
    // alongside the JSON reports finish_charter writes.
    "--output-dir",
    join(OUTPUT_DIR, ".playwright"),
  ],
};
