import type { ExecutionResult } from "@reactcode/shared";
import { executionService } from "../execution/executionService.js";
import type { ProblemDef } from "./types.js";

// The quality bar every problem must meet, shared by `npm run problems:verify` and the
// admin API (which refuses to save a problem that fails it).

export interface VerificationResult {
  issues: string[];
  /** Props the first public test rendered the component with, for the browser preview. */
  previewProps?: unknown;
}

export function metadataIssues(p: Pick<ProblemDef, "hints" | "tests" | "requirements" | "explanation">): string[] {
  const issues: string[] = [];
  if (p.hints.length < 2 || p.hints.length > 4) issues.push(`has ${p.hints.length} hints (want 2–4)`);
  if (!p.tests.some((t) => !t.hidden)) issues.push("has no public test");
  if (!p.tests.some((t) => t.hidden)) issues.push("has no hidden test");
  if (p.requirements.length === 0) issues.push("has no requirements");
  if (!p.explanation.trim()) issues.push("has no explanation");
  return issues;
}

function run(p: ProblemDef, code: string): Promise<ExecutionResult> {
  return executionService.execute({
    mode: "SUBMIT",
    userCode: code,
    mockApi: p.mockApi ?? null,
    tests: p.tests.map((t, i) => ({ id: String(i), name: t.name, code: t.code, isHidden: !!t.hidden })),
  });
}

export function describeResult(r: ExecutionResult) {
  const failed = r.tests.filter((t) => !t.passed).map((t) => `      ✗ ${t.name}: ${t.error?.split("\n")[0]}`);
  return [`${r.status} ${r.testsPassed}/${r.totalTests}${r.error ? " — " + r.error.message : ""}`, ...failed].join("\n");
}

export async function verifyProblem(p: ProblemDef): Promise<VerificationResult> {
  const issues = metadataIssues(p);

  const [solution, starter, ...wrong] = await Promise.all([
    run(p, p.solutionCode),
    run(p, p.starterCode),
    ...(p.wrongSolutions ?? []).map((code) => run(p, code)),
  ]);

  if (solution.status !== "PASSED") issues.push(`official solution did not pass: ${describeResult(solution)}`);
  if (starter.status !== "FAILED") issues.push(`starter code should FAIL cleanly but got: ${describeResult(starter)}`);
  wrong.forEach((r, i) => {
    if (r.status === "PASSED") issues.push(`wrong solution #${i + 1} PASSED — tests are too weak`);
    if (r.status === "COMPILE_ERROR") issues.push(`wrong solution #${i + 1} doesn't compile: ${r.error?.message}`);
  });

  const captured = solution.status === "PASSED" && solution.previewProps && Object.keys(solution.previewProps).length > 0;
  return { issues, previewProps: captured ? solution.previewProps : undefined };
}
