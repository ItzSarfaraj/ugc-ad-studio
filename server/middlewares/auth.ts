import { NextFunction, Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { verifyToken } from "../configs/jwt.js";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(401).json({ message: "Unauthorized" });
  }
};