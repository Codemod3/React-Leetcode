import path from "node:path";
import { fileURLToPath } from "node:url";
import { LocalExecutionService } from "@reactcode/problem-engine";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// apps/api/src/execution -> apps/api (cwd react/@testing-library resolve from here)
const apiRoot = path.resolve(__dirname, "..", "..");

export const executionService = new LocalExecutionService({
  cwd: apiRoot,
  timeoutMs: 8000,
  maxOldSpaceMb: 256,
});
