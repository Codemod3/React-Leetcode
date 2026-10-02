import { createHash } from "node:crypto";
import type { ProblemDef } from "./types.js";

/** Changes whenever what the learner codes against changes, which invalidates saved drafts. */
export function contentHash(p: Pick<ProblemDef, "starterCode" | "tests" | "mockApi">) {
  return createHash("sha256")
    .update(JSON.stringify([p.starterCode, p.tests, p.mockApi ?? null]))
    .digest("hex")
    .slice(0, 16);
}
