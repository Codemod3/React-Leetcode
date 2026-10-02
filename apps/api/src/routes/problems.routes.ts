import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { Errors } from "../utils/AppError.js";
import { getProblemDetail, getProgressMap, toProblemSummary, toSolution } from "../services/problem.service.js";

export const problemsRouter = Router();

const progressSchema = z.object({
  code: z.string().max(50_000).optional(),
  bookmarked: z.boolean().optional(),
  notes: z.string().max(10_000).optional(),
});

problemsRouter.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { category, difficulty, search, collection } = req.query as Record<string, string | undefined>;

    // Summaries only — descriptions, starter code and solutions stay out of the list payload.
    const problems = await prisma.problem.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(search ? { title: { contains: search } } : {}),
        ...(collection ? { collections: { contains: `"${collection}"` } } : {}),
      },
      orderBy: { order: "asc" },
    });

    const progressMap = req.auth
      ? await getProgressMap(req.auth.userId, problems.map((p) => p.id))
      : new Map();

    res.json({
      success: true,
      data: problems.map((p) => toProblemSummary(p, progressMap.get(p.id))),
    });
  })
);

problemsRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.problem.findMany({ select: { category: true }, distinct: ["category"] });
    res.json({ success: true, data: rows.map((r) => r.category) });
  })
);

problemsRouter.get(
  "/:slug",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const detail = await getProblemDetail(req.params.slug, req.auth?.userId);
    if (!detail) throw Errors.notFound("Problem not found");
    res.json({ success: true, data: detail });
  })
);

problemsRouter.get(
  "/:slug/solution",
  requireAuth,
  asyncHandler(async (req, res) => {
    const problem = await prisma.problem.findUnique({ where: { slug: req.params.slug } });
    if (!problem) throw Errors.notFound("Problem not found");

    res.json({ success: true, data: toSolution(problem) });
  })
);

problemsRouter.put(
  "/:slug/progress",
  requireAuth,
  asyncHandler(async (req, res) => {
    const problem = await prisma.problem.findUnique({ where: { slug: req.params.slug } });
    if (!problem) throw Errors.notFound("Problem not found");

    const { code, bookmarked, notes } = progressSchema.parse(req.body);
    const draft = code !== undefined ? { savedCode: code, savedCodeHash: problem.contentHash } : {};

    const progress = await prisma.userProblemProgress.upsert({
      where: { userId_problemId: { userId: req.auth!.userId, problemId: problem.id } },
      create: {
        userId: req.auth!.userId,
        problemId: problem.id,
        ...draft,
        bookmarked: bookmarked ?? false,
        notes,
      },
      update: {
        ...draft,
        ...(bookmarked !== undefined ? { bookmarked } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    res.json({ success: true, data: progress });
  })
);
