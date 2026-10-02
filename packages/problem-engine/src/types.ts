import type { ExecutionResult, MockRoute } from "@reactcode/shared";

/** A single test case as stored by the problem engine — `code` is an author-written
 * (trusted) test body, not user input. Helpers in scope: React, Component, userExports,
 * render, renderComponent, renderHook, act, screen, fireEvent, waitFor, within, userEvent,
 * mockApi ({ calls, setRoutes }), mockFn, assert, assertEqual, expectText, expectNoText,
 * sleep, captureConsoleErrors, anyConsoleError. */
export interface EngineTestCase {
  id: string;
  name: string;
  code: string;
  isHidden: boolean;
}

export interface ExecutionJob {
  /** Untrusted TSX source submitted by the learner. Must have a default export. */
  userCode: string;
  tests: EngineTestCase[];
  mockApi?: MockRoute[] | null;
  /** RUN only executes non-hidden tests; SUBMIT runs everything and is authoritative. */
  mode: "RUN" | "SUBMIT";
  timeoutMs?: number;
}

/** The execution engine abstraction. The API layer only ever talks to this interface —
 * it never knows whether code ran in a child process, a Docker container, or a remote
 * execution cluster. Swapping LocalExecutionService for a DockerExecutionService later
 * requires no changes outside this package. */
export interface CodeExecutionService {
  execute(job: ExecutionJob): Promise<ExecutionResult>;
}
