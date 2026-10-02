import { Router } from "express";
import { z } from "zod";
import type { Problem, TestCase } from "@prisma/client";
import type { AdminProblem, AdminProblemInput, AdminProblemSummary, VerificationReport } from "@reactcode/shared";
import { prisma } from "../db/prisma.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { Errors } from "../utils/AppError.js";
import { verifyProblem } from "../problem-bank/verify.js";
import { contentHash } from "../problem-bank/content-hash.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

const nonEmpty = z.string().trim().min(1);

const problemInput = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "use lowercase words separated by hyphens").max(80),
  title: nonEmpty.max(120),
  difficulty: z.enum(["BEGINNER", "EASY", "MEDIUM", "HARD"]),
  category: nonEmpty.max(60),
  level: z.number().int().min(1).max(99),
  tags: z.array(nonEmpty.max(40)).max(12),
  type: z.enum(["COMPONENT", "HOOK", "API", "STATE", "REDUX", "CUSTOM_HOOK", "PERFORMANCE", "ARCHITECTURE"]),
  problemType: z.enum(["BUILD", "DEBUG", "REFACTOR", "IMPLEMENT", "OPTIMIZE", "TEST"]),
  estimatedMinutes: z.number().int().min(1).max(240).nullable(),
  description: nonEmpty.max(20_000),
  requirements: z.array(nonEmpty.max(500)).min(1).max(20),
  hints: z.array(nonEmpty.max(1000)).max(10),
  prerequisites: z.array(nonEmpty.max(60)).max(10),
  starterCode: nonEmpty.max(50_000),
  solutionCode: nonEmpty.max(50_000),
  explanation: nonEmpty.max(20_000),
  commonMistakes: z.array(nonEmpty.max(1000)).max(10),
  alternativeApproach: z.string().max(5000).nullable(),
  mockApi: z
    .array(
      z.object({
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
        url: z.string().startsWith("/"),
        response: z.unknown(),
        status: z.number().int().min(100).max(599).optional(),
        delayMs: z.number().int().min(0).max(5000).optional(),
      })
    )
    .max(20)
    .nullable(),
  tests: z.array(z.object({ name: nonEmpty.max(200), code: nonEmpty.max(20_000), hidden: z.boolean() })).min(2).max(30),
  wrongSolutions: z.array(nonEmpty.max(50_000)).max(10),
});

/** zod types `response: unknown` as optional; a missing response just means an empty body. */
const parseInput = (body: unknown): AdminProblemInput => problemInput.parse(body) as AdminProblemInput;

const toDef = (input: AdminProblemInput) => ({
  ...input,
  estimatedMinutes: input.estimatedMinutes ?? undefined,
  alternativeApproach: input.alternativeApproach ?? undefined,
  mockApi: input.mockApi ?? undefined,
});

async function verify(input: AdminProblemInput): Promise<{ report: VerificationReport; previewProps?: unknown }> {
  const { issues, previewProps } = await verifyProblem(toDef(input));
  return { report: { ok: issues.length === 0, issues }, previewProps };
}

function toRow(input: AdminProblemInput, previewProps: unknown) {
  return {
    title: input.title,
    description: input.description,
    difficulty: input.difficulty,
    category: input.category,
    level: input.level,
    tags: JSON.stringify(input.tags),
    type: input.type,
    problemType: input.problemType,
    environment: JSON.stringify({ react: true, previewProps: previewProps ?? null }),
    mockApi: input.mockApi ? JSON.stringify(input.mockApi) : null,
    requirements: JSON.stringify(input.requirements),
    hints: JSON.stringify(input.hints),
    prerequisites: JSON.stringify(input.prerequisites),
    estimatedMinutes: input.estimatedMinutes,
    starterCode: input.starterCode,
    solutionCode: input.solutionCode,
    explanation: input.explanation,
    commonMistakes: JSON.stringify(input.commonMistakes),
    alternativeApproach: input.alternativeApproach,
    wrongSolutions: JSON.stringify(input.wrongSolutions),
    contentHash: contentHash(toDef(input)),
  };
}

function testRows(problemId: string, input: AdminProblemInput) {
  return input.tests.map((t, index) => ({
    problemId,
    name: t.name,
    type: "INTERACTION",
    spec: JSON.stringify({ code: t.code }),
    isHidden: t.hidden,
    order: index,
  }));
}

function toAdminProblem(p: Problem, tests: TestCase[]): AdminProblem {
  return {
    id: p.id,
    order: p.order,
    source: p.source === "admin" ? "admin" : "bank",
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty as AdminProblem["difficulty"],
    category: p.category,
    level: p.level,
    tags: JSON.parse(p.tags),
    type: p.type as AdminProblem["type"],
    problemType: p.problemType as AdminProblem["problemType"],
    estimatedMinutes: p.estimatedMinutes,
    description: p.description,
    requirements: JSON.parse(p.requirements),
    hints: JSON.parse(p.hints),
    prerequisites: JSON.parse(p.prerequisites),
    starterCode: p.starterCode,
    solutionCode: p.solutionCode,
    explanation: p.explanation,
    commonMistakes: JSON.parse(p.commonMistakes),
    alternativeApproach: p.alternativeApproach,
    mockApi: p.mockApi ? JSON.parse(p.mockApi) : null,
    tests: tests
      .sort((a, b) => a.order - b.order)
      .map((t) => ({ name: t.name, code: JSON.parse(t.spec).code, hidden: t.isHidden })),
    wrongSolutions: JSON.parse(p.wrongSolutions),
  };
}

async function findEditable(id: string) {
  const problem = await prisma.problem.findUnique({ where: { id } });
  if (!problem) throw Errors.notFound("Problem not found");
  if (problem.source !== "admin") {
    throw Errors.forbidden("Bank problems are defined in code (apps/api/src/problem-bank). Duplicate it to create an editable copy.");
  }
  return problem;
}

adminRouter.get(
  "/problems",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.problem.findMany({
      orderBy: { order: "asc" },
      select: { id: true, slug: true, title: true, difficulty: true, category: true, order: true, source: true },
    });
    const data: AdminProblemSummary[] = rows.map((r) => ({
      ...r,
      difficulty: r.difficulty as AdminProblemSummary["difficulty"],
      source: r.source === "admin" ? "admin" : "bank",
    }));
    res.json({ success: true, data });
  })
);

adminRouter.get(
  "/problems/:id",
  asyncHandler(async (req, res) => {
    const problem = await prisma.problem.findUnique({ where: { id: req.params.id }, include: { testCases: true } });
    if (!problem) throw Errors.notFound("Problem not found");
    res.json({ success: true, data: toAdminProblem(problem, problem.testCases) });
  })
);

adminRouter.post(
  "/problems/verify",
  asyncHandler(async (req, res) => {
    const input = parseInput(req.body);
    const { report } = await verify(input);
    res.json({ success: true, data: report });
  })
);

adminRouter.post(
  "/problems",
  asyncHandler(async (req, res) => {
    const input = parseInput(req.body);
    if (await prisma.problem.findUnique({ where: { slug: input.slug } })) throw Errors.conflict(`The slug "${input.slug}" is already taken`);

    const { report, previewProps } = await verify(input);
    if (!report.ok) throw Errors.verificationFailed(report.issues);

    const last = await prisma.problem.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
    const created = await prisma.$transaction(async (tx) => {
      const problem = await tx.problem.create({
        data: { slug: input.slug, ...toRow(input, previewProps), order: (last?.order ?? 0) + 1, source: "admin" },
      });
      await tx.testCase.createMany({ data: testRows(problem.id, input) });
      return problem;
    });
    res.status(201).json({ success: true, data: { id: created.id, slug: created.slug } });
  })
);

adminRouter.put(
  "/problems/:id",
  asyncHandler(async (req, res) => {
    const existing = await findEditable(req.params.id);
    const input = parseInput(req.body);
    if (input.slug !== existing.slug && (await prisma.problem.findUnique({ where: { slug: input.slug } }))) {
      throw Errors.conflict(`The slug "${input.slug}" is already taken`);
    }

    const { report, previewProps } = await verify(input);
    if (!report.ok) throw Errors.verificationFailed(report.issues);

    await prisma.$transaction([
      prisma.problem.update({ where: { id: existing.id }, data: { slug: input.slug, ...toRow(input, previewProps) } }),
      prisma.testCase.deleteMany({ where: { problemId: existing.id } }),
      prisma.testCase.createMany({ data: testRows(existing.id, input) }),
    ]);
    res.json({ success: true, data: { id: existing.id, slug: input.slug } });
  })
);

adminRouter.delete(
  "/problems/:id",
  asyncHandler(async (req, res) => {
    const existing = await findEditable(req.params.id);
    await prisma.problem.delete({ where: { id: existing.id } });
    res.json({ success: true, data: null });
  })
);
