import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExecutionResult } from "@reactcode/shared";
import type { CodeExecutionService, ExecutionJob } from "../types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNNER_PATH = path.join(__dirname, "runner.cjs");
const RESULT_MARKER = "__REACTCODE_RESULT__";

export interface LocalExecutionServiceOptions {
  /** cwd the runner process is spawned with — must have react/@testing-library resolvable
   * via node_modules. Defaults to the API app's own directory. */
  cwd: string;
  timeoutMs?: number;
  maxOldSpaceMb?: number;
}

/**
 * Dev-grade execution engine: runs each submission in its own short-lived Node
 * child process (separate from the Express server process), with a wall-clock
 * timeout and a heap cap. This is NOT a hardened multi-tenant sandbox — it has
 * no container/VM boundary, so it should not be exposed to hostile internet
 * traffic as-is. It implements the same CodeExecutionService interface a future
 * DockerExecutionService/Firecracker/remote-worker implementation would, so the
 * API and frontend never need to change when that swap happens.
 */
export class LocalExecutionService implements CodeExecutionService {
  constructor(private options: LocalExecutionServiceOptions) {}

  async execute(job: ExecutionJob): Promise<ExecutionResult> {
    const timeoutMs = job.timeoutMs ?? this.options.timeoutMs ?? 8000;
    const tempDir = await mkdtemp(path.join(tmpdir(), "reactcode-exec-"));
    const start = Date.now();

    try {
      const testsForMode = job.mode === "RUN" ? job.tests.filter((t) => !t.isHidden) : job.tests;

      await Promise.all([
        writeFile(path.join(tempDir, "component.tsx"), job.userCode, "utf-8"),
        writeFile(path.join(tempDir, "tests.json"), JSON.stringify(testsForMode), "utf-8"),
        writeFile(path.join(tempDir, "mockApi.json"), JSON.stringify(job.mockApi ?? null), "utf-8"),
      ]);

      const stdout = await this.spawnRunner(tempDir, timeoutMs);
      const executionTimeMs = Date.now() - start;

      const markerIndex = stdout.lastIndexOf(RESULT_MARKER);
      if (markerIndex === -1) {
        return {
          status: "RUNTIME_ERROR",
          testsPassed: 0,
          totalTests: testsForMode.length,
          executionTimeMs,
          tests: [],
          error: { message: "Execution produced no result", stack: stdout.slice(-2000) },
        };
      }

      const parsed = JSON.parse(stdout.slice(markerIndex + RESULT_MARKER.length));
      return { ...parsed, executionTimeMs };
    } catch (err: unknown) {
      const executionTimeMs = Date.now() - start;
      const isTimeout = (err as { killed?: boolean; signal?: string })?.signal === "SIGTERM";
      return {
        status: isTimeout ? "TIMEOUT" : "RUNTIME_ERROR",
        testsPassed: 0,
        totalTests: job.tests.length,
        executionTimeMs,
        tests: [],
        error: { message: isTimeout ? "Execution timed out" : String((err as Error)?.message ?? err) },
      };
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  private spawnRunner(tempDir: string, timeoutMs: number): Promise<string> {
    const maxOldSpaceMb = this.options.maxOldSpaceMb ?? 256;
    return new Promise((resolve, reject) => {
      execFile(
        process.execPath,
        [`--max-old-space-size=${maxOldSpaceMb}`, RUNNER_PATH, tempDir],
        {
          cwd: this.options.cwd,
          timeout: timeoutMs,
          killSignal: "SIGTERM",
          maxBuffer: 4 * 1024 * 1024,
          env: {
            // Deliberately minimal env — no DATABASE_URL, no JWT_SECRET, no network creds.
            PATH: process.env.PATH,
            NODE_ENV: "sandbox",
          },
        },
        (error, stdout) => {
          if (error && !stdout.includes(RESULT_MARKER)) {
            reject(error);
            return;
          }
          resolve(stdout);
        }
      );
    });
  }
}
