import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { env } from "../env.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { Errors } from "../utils/AppError.js";

export const authRouter = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setSessionCookie(res: import("express").Response, userId: string, role: string) {
  const token = jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: "7d" });
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { username: body.username }] },
    });
    if (existing) throw Errors.conflict("Username or email already in use");

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { username: body.username, email: body.email, passwordHash },
    });

    setSessionCookie(res, user.id, user.role);
    res.status(201).json({
      success: true,
      data: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) throw Errors.unauthorized("Invalid email or password");

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) throw Errors.unauthorized("Invalid email or password");

    setSessionCookie(res, user.id, user.role);
    res.json({
      success: true,
      data: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  })
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(env.cookieName);
  res.json({ success: true, data: null });
});

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user) throw Errors.unauthorized("Session no longer valid");
    res.json({
      success: true,
      data: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  })
);
