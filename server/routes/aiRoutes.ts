import express from "express";
import { generateScript, generatePrompt } from "../controllers/aiTextController.js";
import { protect } from "../middlewares/auth.js";

const aiRouter = express.Router();

aiRouter.post("/generate-script", protect, generateScript);
aiRouter.post("/generate-prompt", protect, generatePrompt);


export default aiRouter;