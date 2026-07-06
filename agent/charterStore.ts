import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TourCharter {
  id: string;
  name: string;
  mission: string;
  focus: string;
  agent_actions: string[];
  look_for: string[];
  output_emphasis: string;
  agent_friendliness: "high" | "medium" | "low";
}

export interface ReportFormat {
  tour_summary: string[];
  key_findings: string[];
  defect_details: string[];
  coverage_notes: string[];
}

export interface CharterFile {
  version: string;
  report_format: ReportFormat;
  tours: TourCharter[];
}
// ---------------------------------------------------------------------------
// The final report the agent hands back through finish_charter.
//
// This zod schema mirrors report_format in charters.json. Because it is the
// finish_charter tool's input schema, the SDK validates the agent's JSON at the
// tool boundary and makes the agent retry until the report actually conforms.
// ---------------------------------------------------------------------------

export const reportSchema = z.object({
  tour_summary: z.object({
    tour_name: z.string().describe("The name of the tour charter, e.g. 'Rained-Out Tour'."),
    product_area: z.string().describe("Which product area or feature was tested, e.g. 'checkout', 'search', 'profile'."), 
    test_data_used: z.string().describe("Description of the test data used for this tour."),
    coverage_summary: z.string().describe("Summary of what was covered during the tour."),
  }),
  key_findings: z.object({
    product_observations: z.array(z.string()).describe("General observations about the product's behavior or performance."),
    questions_for_the_team: z.array(z.string()).describe("Questions that arise during testing and need clarification from the development team."),
  }),
  defect_details: z.array(
    z.object({
      title: z.string().describe("A brief title for the defect, summarizing the issue."),
      severity: z.enum(["critical", "high", "medium", "low"]).describe("The severity of the defect."),
      confidence: z.enum(["high", "medium", "low"]).describe("The confidence in the defect's existence."),
      risk: z.string().describe("The potential impact of the defect."),
      steps_to_reproduce: z.array(z.string()).describe("The steps to reproduce the defect."),
      expected: z.string().describe("The expected behavior."),
      actual: z.string().describe("The actual behavior observed."),
      evidence: z.array(z.string()).min(1).describe("Evidence supporting the defect report."),
      suspected_cause: z.string().optional().describe("Optional suspected cause of the defect."),
    }),
  ),
  coverage_notes: z.object({
    what_was_covered: z.string().describe("Description of what was covered during the tour."),
    what_was_not_covered: z.string().describe("Description of what was not covered during the tour."),
    suggested_follow_up_tours: z.array(z.string()).describe("Suggested follow-up tours based on the testing results."),
    automation_candidates: z.array(z.string()).describe("Potential areas for test automation.") ,
  }),
});

export type TourReport = z.infer<typeof reportSchema>;

// A report assembled piece by piece across the session. Every top-level field is
// optional until finish_charter fills in the rest; tour_summary and coverage_notes
// may also arrive partially (record_findings sets only tour_summary.tour_name).
export type ReportDraft = {
  tour_summary?: Partial<TourReport["tour_summary"]>;
  key_findings?: TourReport["key_findings"];
  defect_details?: TourReport["defect_details"];
  coverage_notes?: Partial<TourReport["coverage_notes"]>;
};

// A per-run store. record_findings and finish_charter merge into `report`.
interface TourSession {
  finished: boolean;
  report: ReportDraft;
}

export const session: TourSession = {
  finished: false,
  report: {},
};
// ---------------------------------------------------------------------------
// Load the charter JSON file (once, then keep it in a variable)
// ---------------------------------------------------------------------------
const thisFilePath = fileURLToPath(import.meta.url);
const thisFolder = dirname(thisFilePath);
const CHARTER_PATH = join(thisFolder, "data", "charters.json");
let cachedFile: CharterFile | null = null;

export function loadCharters(): CharterFile {
  if (cachedFile !== null) {
    return cachedFile;
  }

  const raw = readFileSync(CHARTER_PATH, "utf-8");
  const parsed = JSON.parse(raw) as CharterFile;

  if (!parsed.tours || parsed.tours.length === 0) {
    throw new Error("No tours found in charter file at " + CHARTER_PATH);
  }

  cachedFile = parsed;
  return parsed;
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// Turn "Rained-Out Tour", "rained_out", "rainedout" all into the same string
// so they can be compared.
function normalizeId(value: string): string {
  let result = value.toLowerCase();
  result = result.replace(/tour$/i, ""); // drop a trailing "tour"
  result = result.replace(/[^a-z0-9]/g, ""); // keep only letters and numbers
  return result;
}
// Find one tour by its id or name. Returns undefined if nothing matches.

export function findTour(idOrName: string): TourCharter | undefined {
  const file = loadCharters();
  const target = normalizeId(idOrName);

  for (let i = 0; i < file.tours.length; i++) {
    const tour = file.tours[i];
    if (normalizeId(tour.id) === target || normalizeId(tour.name) === target) {
      return tour;
    }
  }

  return undefined;
}
// A short summary of every tour: just id, name, focus, and friendliness.

export function listTourSumaries(): Array<{
  id: string;
  name: string;
  focus: string;
  agent_friendliness: string;
}> {
  const file = loadCharters();
  const summaries = [];

  for (let i = 0; i < file.tours.length; i++) {
    const tour = file.tours[i];
    summaries.push({
      id: tour.id,
      name: tour.name,
      focus: tour.focus,
      agent_friendliness: tour.agent_friendliness,
    });
  }

  return summaries;
}
// Build the list of valid tour ids from the file, for the tool's input schema.
function getTourIds(): [string, ...string[]] {
  const file = loadCharters();
  const ids = [];

  for (let i = 0; i < file.tours.length; i++) {
    ids.push(file.tours[i].id);
  }

  return ids as [string, ...string[]];
}
export const TOUR_IDS = getTourIds();

// ---------------------------------------------------------------------------
// Persisting the final report
// ---------------------------------------------------------------------------

// Where reports are written. Defaults to agent/reports/, overridable with the
// TOUR_RESULTS_DIR env var (e.g. to point CI at its artifacts directory).
// Exported so agent.ts can point the Playwright MCP's --output-dir here too,
// keeping screenshots and other browser output beside the JSON reports.
export const OUTPUT_DIR = process.env.TOUR_RESULTS_DIR ?? join(thisFolder, "reports");

// Turn "Rained-Out Tour" into "rained-out-tour" for a tidy filename.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// True for plain {...} objects, but not arrays or null.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Merge `source` into `target`: recurse into nested objects, replace arrays and
// primitives. Returns a new object; neither input is mutated.
function deepMerge<T>(target: T, source: Partial<T>): T {
  const merged: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  for (const [key, value] of Object.entries(source)) {
    const existing = merged[key];
    merged[key] =
      isPlainObject(existing) && isPlainObject(value)
        ? deepMerge(existing, value)
        : value;
  }
  return merged as T;
}

// One file per session, chosen once on the first save so every incremental merge
// rewrites the same file. Uses the tour name if it is already known.
let reportPath: string | null = null;

function reportFilePath(draft: ReportDraft): string {
  if (reportPath === null) {
    const name = draft.tour_summary?.tour_name ?? "tour";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    reportPath = join(OUTPUT_DIR, `${slugify(name)}-${timestamp}.json`);
  }
  return reportPath;
}

// Deep-merge a partial report into the session accumulator, write the whole
// accumulator to the one per-session file, and return its path. Call repeatedly
// to build the report incrementally.
export function saveReport(partial: ReportDraft): string {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  session.report = deepMerge(session.report, partial);
  const filePath = reportFilePath(session.report);

  writeFileSync(filePath, JSON.stringify(session.report, null, 2), "utf-8");
  return filePath;
}
