import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import ai from "../configs/ai.js";

const TEXT_MODEL = "gemini-2.5-flash";

// POST /api/ai/generate-script
export const generateScript = async (req: Request, res: Response) => {
  try {
    const {
      productName,
      productDescription = "",
      userPrompt = "",
      language = "English",
      tone = "energetic and casual",
    } = req.body;

    if (!productName) {
      return res.status(400).json({ message: "productName is required" });
    }

    const instruction = `You are an expert UGC (user-generated content) ad scriptwriter.
Write a short spoken script (max 4-5 sentences, ~15-20 seconds when spoken aloud)
for a single creator/model to say directly to camera while showcasing a product.

Product name: ${productName}
Product description: ${productDescription || "N/A"}
Creator direction from user: ${userPrompt || "N/A"}
Tone: ${tone}
Language: write the ENTIRE script in ${language}. Do not mix languages.

Rules:
- Sound like a real person talking casually, not a formal advertisement.
- Mention the product name naturally at least once.
- No stage directions, no emojis, no hashtags — just the spoken lines.
- Output ONLY the script text, nothing else (no preamble, no quotes).`;

    const response: any = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ text: instruction }],
      config: { temperature: 0.9, maxOutputTokens: 512 },
    });

    const script = response?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      .filter(Boolean)
      .join("")
      .trim();

    if (!script) throw new Error("Failed to generate script");

    res.json({ script });
  } catch (error: any) {
    console.error("SCRIPT GENERATION ERROR:", error.message);
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/ai/generate-prompt
export const generatePrompt = async (req: Request, res: Response) => {
  try {
    const { productName, productDescription = "", idea = "" } = req.body;

    if (!productName) {
      return res.status(400).json({ message: "productName is required" });
    }

    const instruction = `You help users write creative direction prompts for an AI UGC ad generator.
Write a clear, vivid, single-paragraph creative direction describing how a model should
hold/use/showcase the product in a photo and short video. Keep it under 60 words.
Output ONLY the prompt, nothing else.

Product: ${productName}
Product description: ${productDescription || "N/A"}
${idea ? `User's rough idea to build on: ${idea}` : "No specific direction given — invent a compelling, on-brand creative concept yourself."}`;

    const response: any = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ text: instruction }],
      config: { temperature: 0.8, maxOutputTokens: 256 },
    });

    const generatedPrompt = response?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      .filter(Boolean)
      .join("")
      .trim();

    if (!generatedPrompt) throw new Error("Failed to generate prompt");

    res.json({ prompt: generatedPrompt });
  } catch (error: any) {
    console.error("PROMPT GENERATION ERROR:", error.message);
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};
