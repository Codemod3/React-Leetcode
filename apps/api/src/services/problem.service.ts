import type { Problem, UserProblemProgress } from "@prisma/client";
import type { ProblemDetail, ProblemSolution, ProblemSummary, ProgressStatus } from "@reactcode/shared";
import { prisma } from "../db/prisma.js";

export function toProblemSummary(problem: Problem, progress?: UserProblemProgress | null): ProblemSummary {
  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty as ProblemSummary["difficulty"],
    category: problem.category,
    level: problem.level,
    order: problem.order,
    tags: JSON.parse(problem.tags),
    problemType: problem.problemType as ProblemSummary["problemType"],
    collections: JSON.parse(problem.collections),
    status: (progress?.status as ProgressStatus) ?? "NOT_STARTED",
    attempts: progress?.attempts ?? 0,
    bookmarked: progress?.bookmarked ?? false,
  };
}

export async function getProblemDetail(slug: string, userId?: string): Promise<ProblemDetail | null> {
  const problem = await prisma.problem.findUnique({ where: { slug } });
  if (!problem) return null;

  const [progress, next, publicTests, solvedByCategory] = await Promise.all([
    userId
      ? prisma.userProblemProgress.findUnique({ where: { userId_problemId: { userId, problemId: problem.id } } })
      : null,
    prisma.problem.findFirst({
      where: { order: { gt: problem.order } },
      orderBy: { order: "asc" },
      select: { slug: true, title: true },
    }),
    prisma.testCase.findMany({
      where: { problemId: problem.id, isHidden: false },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
    userId ? solvedCategories(userId) : new Set<string>(),
  ]);

  const prerequisites: string[] = JSON.parse(problem.prerequisites);

  // A draft written against an older version of the problem (different starter code or
  // tests) isn't loaded silently; the client offers it as "restore previous draft" instead.
  const draft = progress?.savedCode ?? null;
  const draftIsCurrent = draft !== null && progress?.savedCodeHash === problem.contentHash;
  const staleDraft = draft !== null && !draftIsCurrent && draft !== problem.starterCode ? draft : null;

  return {
    ...toProblemSummary(problem, progress),
    description: problem.description,
    requirements: JSON.parse(problem.requirements),
    hints: JSON.parse(problem.hints),
    starterCode: problem.starterCode,
    savedCode: draftIsCurrent ? draft : null,
    staleDraft,
    type: problem.type as ProblemDetail["type"],
    environment: JSON.parse(problem.environment),
    mockApi: problem.mockApi ? JSON.parse(problem.mockApi) : null,
    estimatedMinutes: problem.estimatedMinutes,
    prerequisites: prerequisites.map((category) => ({ category, met: solvedByCategory.has(category) })),
    nextProblem: next,
    publicTests,
  };
}

async function solvedCategories(userId: string): Promise<Set<string>> {
  const solved = await prisma.userProblemProgress.findMany({
    where: { userId, status: "SOLVED" },
    select: { problem: { select: { category: true } } },
  });
  return new Set(solved.map((s) => s.problem.category));
}

export function toSolution(problem: Problem): ProblemSolution {
  return {
    solutionCode: problem.solutionCode,
    explanation: problem.explanation,
    commonMistakes: JSON.parse(problem.commonMistakes),
    alternativeApproach: problem.alternativeApproach,
  };
}

export async function getProgressMap(userId: string, problemIds: string[]) {
  const rows = await prisma.userProblemProgress.findMany({
    where: { userId, problemId: { in: problemIds } },
  });
  return new Map(rows.map((r) => [r.problemId, r]));
}
