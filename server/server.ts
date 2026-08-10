import "./configs/instrument.mjs";
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import * as Sentry from "@sentry/node";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js"; // added in Phase 3
import imagekit from "./configs/imagekit.js";
import aiRouter from "./routes/aiRoutes.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true })); // credentials:true is required for cookies to work cross-origin
app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Server is Live!");
});
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/project", projectRouter);
app.use("/api/ai", aiRouter);
app.use("/api/payment", paymentRouter);

app.get("/imagekit-test", async (req, res) => {
  res.json({
    public: !!process.env.IMAGEKIT_PUBLIC_KEY,
    private: !!process.env.IMAGEKIT_PRIVATE_KEY,
    endpoint: !!process.env.IMAGEKIT_URL_ENDPOINT,
  });
});

Sentry.setupExpressErrorHandler(app);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});