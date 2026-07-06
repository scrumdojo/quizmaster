/**
 * charterTool.ts
 *
 * Defines the tools for the exploratory-testing agent and bundles them into an
 * in-process MCP server for the Claude Agent SDK.
 *
 *   - get_tour_charter   : fetch the full details of one tour to run
 *   - list_tour_charters : list all tours so the agent can choose one
 *   - finish_charter     : capture the final report (as JSON) and end the session
 *
 * Requires: @anthropic-ai/claude-agent-sdk, zod
 */

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
  type TourReport,
} from './charterStore';

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
async function getTourCharterHandler( args: { tour_id: string;}) {
  const tour = findTour(args.tour_id);
  // If the id did not match any tour, return an error result.
  if (!tour) {
    const errorPayload = {
      error:'Unknown tour_id "' + args.tour_id + '". Call list_tour_charters for valid ids.',
      valid_ids: TOUR_IDS,
    };

    return { 
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

export const getTourCharterTool = tool(
  getTourCharterName,
  getTourCharterDescription,
  getTourCharterSchema,
  getTourCharterHandler,
);

// ---------------------------------------------------------------------------
// Tool 2: list_tour_charters
// ---------------------------------------------------------------------------

const listTourChartersName = "list_tour_charters";

const listTourChartersDescription =
  "List all available exploratory-testing tour charters with id, name, focus, and " +
  "how suited each is to an autonomous agent (high/medium/low). Call this to choose " +
  "which tour to run before calling get_tour_charter.";

async function listTourChartersHandler() {
  const tourSummaries = { tours: listTourSumaries() };
  const tourSummariesJson = JSON.stringify(tourSummaries, null, 2);

  return { // SDK requirement to return an array of content items, each with a type and text
    content: [ { type: "text" as const, text: tourSummariesJson },],
  };
}

export const listTourChartersTool = tool(
  listTourChartersName,
  listTourChartersDescription,
  {}, // this tool takes no input
  listTourChartersHandler,
);

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

export const recordFindingsTool = tool(
  "record_findings",
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
      ],
    };
  },
);

// ------------------------------------------------------------------------------------------
// Tool 4: record_defect - capture defect as we go to build the final report incrementally
// ------------------------------------------------------------------------------------------

export const recordDefectsTool = tool(
  "record_defects",
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
  tools: [getTourCharterTool, listTourChartersTool, finishCharterTool, recordFindingsTool, recordDefectsTool],
});