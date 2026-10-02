import type { Difficulty, MockRoute, ProblemKind, ProblemType } from "@reactcode/shared";

export interface ProblemTestDef {
  name: string;
  /** Trusted, author-written test body. See EngineTestCase for the helpers in scope. */
  code: string;
  hidden?: boolean;
}

export interface ProblemDef {
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  description: string;
  requirements: string[];
  /** 2–4 hints, vague to specific. */
  hints: string[];
  starterCode: string;
  solutionCode: string;
  /** What the concept is and why the solution works. */
  explanation: string;
  commonMistakes?: string[];
  alternativeApproach?: string;
  tests: ProblemTestDef[];
  /** Verification only, never shown to learners: each must FAIL the test suite. */
  wrongSolutions?: string[];
  mockApi?: MockRoute[];
  problemType?: ProblemKind;
  type?: ProblemType;
  estimatedMinutes?: number;
  /** Extra prerequisite categories on top of the category's own. */
  prerequisites?: string[];
}

export interface CategoryBank {
  category: string;
  level: number;
  type: ProblemType;
  prerequisites: string[];
  problems: ProblemDef[];
}

/** A problem after the bank has assigned its global order and collections. */
export interface ResolvedProblem extends ProblemDef {
  category: string;
  level: number;
  order: number;
  type: ProblemType;
  problemType: ProblemKind;
  prerequisites: string[];
  collections: string[];
}

export const test = (name: string, code: string): ProblemTestDef => ({ name, code });
export const hidden = (name: string, code: string): ProblemTestDef => ({ name, code, hidden: true });

/** Starter code for "write this component from scratch" problems. */
export function stub(name: string, opts: { params?: string; imports?: string; before?: string; body?: string } = {}) {
  const imports = opts.imports ? `${opts.imports}\n\n` : "";
  const before = opts.before ? `${opts.before}\n\n` : "";
  const body = opts.body ?? "  // Write your solution here\n  return null;";
  return `${imports}${before}function ${name}(${opts.params ?? ""}) {\n${body}\n}\n\nexport default ${name};\n`;
}
