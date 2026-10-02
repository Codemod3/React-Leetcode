import { Router } from "express";
import { z } from "zod";
import type { SubmissionDetail, SubmissionPage, SubmissionSummary } from "@reactcode/shared";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { Errors } from "../utils/AppError.js";
import { executionService } from "../execution/executionService.js";

export const submissionsRouter = Router();

const execSchema = z.object({
  code: z.string().min(1).max(50_000),
});

async function runAgainstProblem(problemSlug: string, code: string, mode: "RUN" | "SUBMIT") {
  const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
  if (!problem) throw Errors.notFound("Problem not found");

  const testCases = await prisma.testCase.findMany({
    where: { problemId: problem.id },
    orderBy: { order: "asc" },
  });

  const mockApi = problem.mockApi ? JSON.parse(problem.mockApi) : null;

  const result = await executionService.execute({
    mode,
    userCode: code,
    mockApi,
    tests: testCases.map((t) => ({
      id: t.id,
      name: t.name,
      isHidden: t.isHidden,
      code: JSON.parse(t.spec).code as string,
    })),
  });

  return { problem, result };
}

submissionsRouter.post(
  "/problems/:slug/run",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { code } = execSchema.parse(req.body);
    const { result } = await runAgainstProblem(req.params.slug, code, "RUN");
    res.json({ success: true, data: result });
  })
);

submissionsRouter.post(
  "/problems/:slug/submit",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { code } = execSchema.parse(req.body);
    const userId = req.auth!.userId;
    const { problem, result } = await runAgainstProblem(req.params.slug, code, "SUBMIT");

    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId: problem.id,
        code,
        status: result.status,
        mode: "SUBMIT",
        executionTimeMs: result.executionTimeMs,
        testCasesPassed: result.testsPassed,
        totalTestCases: result.totalTests,
        errorMessage: result.error?.message,
      },
    });

    const solved = result.status === "PASSED";
    const existing = await prisma.userProblemProgress.findUnique({
      where: { userId_problemId: { userId, problemId: problem.id } },
    });

    await prisma.userProblemProgress.upsert({
      where: { userId_problemId: { userId, problemId: problem.id } },
      create: {
        userId,
        problemId: problem.id,
        status: solved ? "SOLVED" : "ATTEMPTED",
        attempts: 1,
        savedCode: code,
        savedCodeHash: problem.contentHash,
        bestExecutionTimeMs: solved ? result.executionTimeMs : null,
        lastSubmittedAt: new Date(),
        completedAt: solved ? new Date() : null,
      },
      update: {
        status: solved ? "SOLVED" : existing?.status === "SOLVED" ? "SOLVED" : "ATTEMPTED",
        attempts: (existing?.attempts ?? 0) + 1,
        savedCode: code,
        savedCodeHash: problem.contentHash,
        bestExecutionTimeMs:
          solved && (!existing?.bestExecutionTimeMs || result.executionTimeMs < existing.bestExecutionTimeMs)
            ? result.executionTimeMs
            : existing?.bestExecutionTimeMs,
        lastSubmittedAt: new Date(),
        completedAt: existing?.completedAt ?? (solved ? new Date() : null),
      },
    });

    res.json({ success: true, data: { submissionId: submission.id, result } });
  })
);

submissionsRouter.get(
  "/submissions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { page, problem } = listQuery.parse(req.query);
    const where = { userId: req.auth!.userId, ...(problem ? { problem: { slug: problem } } : {}) };

    // Summaries only: code is fetched per submission on demand.
    const [rows, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          status: true,
          executionTimeMs: true,
          testCasesPassed: true,
          totalTestCases: true,
          createdAt: true,
          problem: { select: { title: true, slug: true } },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    const data: SubmissionPage = {
      items: rows.map(toSummary),
      page,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      total,
    };
    res.json({ success: true, data });
  })
);

submissionsRouter.get(
  "/submissions/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { problem: { select: { title: true, slug: true } } },
    });
    if (!submission || submission.userId !== req.auth!.userId) throw Errors.notFound("Submission not found");
    const data: SubmissionDetail = { ...toSummary(submission), code: submission.code, errorMessage: submission.errorMessage };
    res.json({ success: true, data });
  })
);

const PAGE_SIZE = 20;

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  problem: z.string().max(200).optional(),
});

function toSummary(s: {
  id: string;
  status: string;
  executionTimeMs: number | null;
  testCasesPassed: number;
  totalTestCases: number;
  createdAt: Date;
  problem: { title: string; slug: string };
}): SubmissionSummary {
  return {
    id: s.id,
    status: s.status as SubmissionSummary["status"],
    executionTimeMs: s.executionTimeMs,
    testsPassed: s.testCasesPassed,
    totalTests: s.totalTestCases,
    createdAt: s.createdAt.toISOString(),
    problem: s.problem,
  };
}
