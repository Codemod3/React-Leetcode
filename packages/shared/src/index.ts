// Shared types used by both the API and the web client.
// Keeping these in one package means the frontend never guesses the shape of backend data.

export type Difficulty = "BEGINNER" | "EASY" | "MEDIUM" | "HARD";

export const DIFFICULTIES: Difficulty[] = ["BEGINNER", "EASY", "MEDIUM", "HARD"];

export type ProgressStatus = "NOT_STARTED" | "ATTEMPTED" | "SOLVED";

export type ProblemType =
  | "COMPONENT"
  | "HOOK"
  | "API"
  | "STATE"
  | "REDUX"
  | "CUSTOM_HOOK"
  | "PERFORMANCE"
  | "ARCHITECTURE";

/** What the learner is asked to do, independent of which React feature is involved. */
export type ProblemKind = "BUILD" | "DEBUG" | "REFACTOR" | "IMPLEMENT" | "OPTIMIZE" | "TEST";

export interface ProblemEnvironment {
  react: boolean;
  reduxToolkit?: boolean;
  router?: boolean;
  /** Serialized props for the browser preview: functions as { __fn }, host elements as { __el }. */
  previewProps?: unknown;
}

export interface MockRoute {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Path, optionally with a query string. A route without "?" matches any query string. */
  url: string;
  response: unknown;
  status?: number;
  delayMs?: number;
}

export interface MockRequest {
  method: string;
  url: string;
  body: unknown;
}

/** Shared by the server-side test runner (re-implemented in runner.cjs) and the browser preview. */
export function matchMockRoute(routes: MockRoute[], method: string, rawUrl: string): MockRoute | null {
  const url = rawUrl.replace(/^https?:\/\/[^/]+/, "");
  const path = url.split("?")[0];
  const sameMethod = (r: MockRoute) => (r.method ?? "GET").toUpperCase() === method.toUpperCase();
  return (
    routes.find((r) => sameMethod(r) && r.url === url) ??
    routes.find((r) => sameMethod(r) && !r.url.includes("?") && r.url === path) ??
    null
  );
}

export interface ProblemSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  level: number;
  order: number;
  tags: string[];
  problemType: ProblemKind;
  collections: string[];
  status: ProgressStatus;
  attempts: number;
  bookmarked: boolean;
}

export interface PrerequisiteStatus {
  category: string;
  /** True once the learner has solved at least one problem in that category. */
  met: boolean;
}

export interface ProblemDetail extends ProblemSummary {
  description: string;
  requirements: string[];
  hints: string[];
  starterCode: string;
  savedCode: string | null;
  /** A draft saved against an older version of this problem; not loaded automatically. */
  staleDraft: string | null;
  type: ProblemType;
  environment: ProblemEnvironment;
  mockApi: MockRoute[] | null;
  estimatedMinutes: number | null;
  prerequisites: PrerequisiteStatus[];
  nextProblem: { slug: string; title: string } | null;
  publicTests: { id: string; name: string }[];
}

export interface ProblemSolution {
  solutionCode: string;
  explanation: string;
  commonMistakes: string[];
  alternativeApproach: string | null;
}

export type ExecutionStatus = "PASSED" | "FAILED" | "COMPILE_ERROR" | "RUNTIME_ERROR" | "TIMEOUT";

export interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  hidden: boolean;
  error?: string;
}

export interface ExecutionResult {
  status: ExecutionStatus;
  testsPassed: number;
  totalTests: number;
  executionTimeMs: number;
  tests: TestResult[];
  error?: {
    message: string;
    stack?: string;
  };
  /** Props the first public test rendered the component with (serialized; see runner.cjs). */
  previewProps?: unknown;
}

export interface SubmissionSummary {
  id: string;
  status: ExecutionStatus;
  executionTimeMs: number | null;
  testsPassed: number;
  totalTests: number;
  createdAt: string;
  problem: { title: string; slug: string };
}

export interface SubmissionDetail extends SubmissionSummary {
  code: string;
  errorMessage: string | null;
}

export interface SubmissionPage {
  items: SubmissionSummary[];
  page: number;
  totalPages: number;
  total: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
}

/** Everything an author edits. Tests and wrong solutions never reach learners. */
export interface AdminProblemInput {
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  level: number;
  tags: string[];
  type: ProblemType;
  problemType: ProblemKind;
  estimatedMinutes: number | null;
  description: string;
  requirements: string[];
  hints: string[];
  prerequisites: string[];
  starterCode: string;
  solutionCode: string;
  explanation: string;
  commonMistakes: string[];
  alternativeApproach: string | null;
  mockApi: MockRoute[] | null;
  tests: { name: string; code: string; hidden: boolean }[];
  wrongSolutions: string[];
}

export interface AdminProblem extends AdminProblemInput {
  id: string;
  order: number;
  /** "bank" problems are defined in code and read-only here; "admin" ones are editable. */
  source: "bank" | "admin";
}

export interface AdminProblemSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  order: number;
  source: "bank" | "admin";
}

export interface VerificationReport {
  ok: boolean;
  issues: string[];
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    /** Extra machine-readable context, e.g. the verification issues for a rejected problem. */
    details?: string[];
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

type DifficultyCounts = { beginner: number; easy: number; medium: number; hard: number; total: number };

export interface DashboardStats {
  solved: DifficultyCounts;
  totalProblems: DifficultyCounts;
  currentStreak: number;
  totalAttempts: number;
  completionPercent: number;
  categoryProgress: { category: string; level: number; solved: number; total: number }[];
}

export const COLLECTIONS: Record<string, string> = {
  "beginner-100": "React Beginner 100",
  "hooks-100": "React Hooks 100",
  "api-50": "React API 50",
  "components-100": "React Components 100",
  "debugging-50": "React Debugging 50",
};
