import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
import { signToken } from "../configs/jwt.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    const token = signToken(user.id);
    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, image: user.image, plan: user.plan, credits: user.credits },
    });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user.id);
    res.cookie("token", token, cookieOptions);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, image: user.image, plan: user.plan, credits: user.credits },
    });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("token", cookieOptions);
  res.json({ message: "Logged out" });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, image: user.image, plan: user.plan, credits: user.credits },
    });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};