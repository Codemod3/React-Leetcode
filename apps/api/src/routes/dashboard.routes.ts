import { Router } from "express";
import type { DashboardStats } from "@reactcode/shared";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.auth!.userId;

    const [allProblems, solvedRows, totalAttempts] = await Promise.all([
      prisma.problem.findMany({ select: { id: true, difficulty: true, category: true, level: true } }),
      prisma.userProblemProgress.findMany({ where: { userId, status: "SOLVED" }, select: { problemId: true } }),
      prisma.submission.count({ where: { userId } }),
    ]);

    const solvedIds = new Set(solvedRows.map((p) => p.problemId));

    const counts = (only: (p: (typeof allProblems)[number]) => boolean) => {
      const subset = allProblems.filter(only);
      return {
        beginner: subset.filter((p) => p.difficulty === "BEGINNER").length,
        easy: subset.filter((p) => p.difficulty === "EASY").length,
        medium: subset.filter((p) => p.difficulty === "MEDIUM").length,
        hard: subset.filter((p) => p.difficulty === "HARD").length,
        total: subset.length,
      };
    };

    const totalProblems = counts(() => true);
    const solved = counts((p) => solvedIds.has(p.id));

    const byCategory = new Map<string, { category: string; level: number; solved: number; total: number }>();
    for (const p of allProblems) {
      const entry = byCategory.get(p.category) ?? { category: p.category, level: p.level, solved: 0, total: 0 };
      entry.total++;
      if (solvedIds.has(p.id)) entry.solved++;
      byCategory.set(p.category, entry);
    }

    const stats: DashboardStats = {
      solved,
      totalProblems,
      currentStreak: 0, // requires daily-activity tracking; deferred
      totalAttempts,
      completionPercent: totalProblems.total ? Math.round((solved.total / totalProblems.total) * 100) : 0,
      categoryProgress: Array.from(byCategory.values()).sort((a, b) => a.level - b.level),
    };

    res.json({ success: true, data: stats });
  })
);
