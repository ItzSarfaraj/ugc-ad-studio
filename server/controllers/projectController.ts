import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
import imagekit from "../configs/imagekit.js";
import {
  GenerateContentConfig,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/genai";
import fs from "fs";
import path from "path";
import ai from "../configs/ai.js";
import axios from "axios";

const loadImage = (path: string, mimeType: string) => {
  return {
    inlineData: {
      data: fs.readFileSync(path).toString("base64"),
      mimeType,
    },
  };
};

export const createProject = async (req: Request, res: Response) => {
  let tempProjectId: string;
  const userId = req.userId as string;
  let isCreditDeducted = false;

  const {
    name = "New Project",
    aspectRatio,
    userPrompt,
    productName,
    productDescription,
    targetLength = 5,
    script = "", // ← new
    language = "English", // ← new
  } = req.body;

  const images: any = req.files;

  if (images.length < 2 || !productName) {
    return res
      .status(400)
      .json({ message: "Please upload atleast two images" });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.credits < 5) {
    return res.status(401).json({ message: "Insufficient credits" });
  } else {
    //deduct credits for image generation
    await prisma.user
      .update({
        where: { id: userId },
        data: { credits: { decrement: 5 } },
      })
      .then(() => {
        isCreditDeducted = true;
      });
  }
  try {
    console.log("1️⃣ Uploading images to ImageKit");

    const uploadedImages = await Promise.all(
      images.map(async (item: any) => {
        const result = await imagekit.upload({
          file: fs.readFileSync(item.path),
          fileName: `${Date.now()}-${item.originalname}`,
          folder: "/ugc/input-images",
        });

        return result.url;
      }),
    );

    console.log("2️⃣ Images uploaded successfully");
    const project = await prisma.project.create({
      data: {
        name,
        userId,
        productName,
        productDescription,
        userPrompt,
        aspectRatio,
        targetLength: parseInt(targetLength),
        uploadedImages,
        script, // ← new
        language, // ← new
        isGenerating: true,
      },
    });

    console.log("3️⃣ Project created:", project.id);

    console.log("4️⃣ Calling Gemini");

    tempProjectId = project.id;
    const model = "gemini-3-pro-image";

    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      imageConfig: {
        aspectRatio: aspectRatio || "9:16",
        imageSize: "1K",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.OFF,
        },
      ],
    };

    //image to base64 structure for ai model
    const img1base64 = loadImage(images[0].path, images[0].mimetype);
    const img2base64 = loadImage(images[1].path, images[1].mimetype);

    const prompt = {
      text: `Combine the person and product into realistic photo.
    Make the person naturally hold or use the product. Match lighting, shadows, scale and perspective.
    Make the person stand in professional studio lighting.
    Output ecommerce-quality photo realistic imagery.
    ${script ? `The person will be speaking this line in the video, so their expression/pose should suit: "${script}"` : ""}
    ${userPrompt}`,
    };

    //Generate image using ai model
    const response: any = await ai.models.generateContent({
      model,
      contents: [img1base64, img2base64, prompt],
      config: generationConfig,
    });

    console.log("5️⃣ Gemini generation completed");

    //check if response is valid
    if (!response?.candidates?.[0]?.content?.parts) {
      throw new Error("Unexpected response");
    }

    const parts = response.candidates[0].content.parts;

    let finalBuffer: Buffer | null = null;

    for (const part of parts) {
      if (part.inlineData) {
        finalBuffer = Buffer.from(part.inlineData.data, "base64");
      }
    }

    if (!finalBuffer) {
      throw new Error("Failed to generate image");
    }

    //Upload generated on cloudinary
    console.log("6️⃣ Uploading generated image to Imagekit");
    const uploadResult = await imagekit.upload({
      file: finalBuffer,
      fileName: `generated-${Date.now()}.png`,
      folder: "/ugc/generated-images",
    });
    console.log("7️⃣ Generated image uploaded");

    //store generated in database
    await prisma.project.update({
      where: { id: project.id },
      data: {
        generatedImage: uploadResult.url,
        isGenerating: false,
      },
    });

    res.json({ projectId: project.id });
  } catch (error: any) {
    console.error("IMAGEKIT ERROR:", JSON.stringify(error, null, 2));
    console.error("ERROR MESSAGE:", error.message);
    console.error("HTTP CODE:", error.http_code);

    //refund credit if error occured in generation
    if (tempProjectId!) {
      //update project status and error message
      await prisma.project.update({
        where: { id: tempProjectId },
        data: { isGenerating: false, error: error.message },
      });
    }

    if (isCreditDeducted) {
      //ad credits back
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 5 } },
      });
    }
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

export const createVideo = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const { projectId } = req.body;

  let isCreditDeducted = false;

  try {
    // 1. Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.credits < 10) {
      return res.status(401).json({
        message: "Insufficient credits",
      });
    }

    // 2. Get project
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (project.isGenerating) {
      return res.status(400).json({
        message: "Generation already in progress",
      });
    }

    if (project.generatedVideo) {
      return res.status(400).json({
        message: "Video already generated",
      });
    }

    if (!project.generatedImage) {
      return res.status(400).json({
        message: "Generated image not found",
      });
    }

    // 3. Deduct credits
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: 10,
        },
      },
    });

    isCreditDeducted = true;

    // 4. Mark project as generating
    await prisma.project.update({
      where: { id: projectId },
      data: {
        isGenerating: true,
      },
    });

    console.log("1️⃣ Starting video generation");

    // 5. Download generated image from ImageKit
    const image = await axios.get(project.generatedImage, {
      responseType: "arraybuffer",
    });

    const imageBytes = Buffer.from(image.data);

    console.log("2️⃣ Generated image downloaded");

    // 6. Create video prompt
    const prompt = `
  Create a realistic UGC product advertisement video.

  The person should naturally showcase and use the product.

  Product:
  ${project.productName}

  ${project.productDescription ? `Product Description:\n${project.productDescription}` : ""}

  ${
    project.script
      ? `The person must speak the following lines naturally and clearly in ${project.language}, with lip sync matching the audio:
  "${project.script}"`
      : `The person may speak a short, natural line about the product in ${project.language}.`
  }

  Make the person's movements natural and realistic.
  Keep the product clearly visible.
  Use realistic lighting, shadows, camera movement and human motion.
  Make it look like a professional social media advertisement.
`;

    // 7. Generate video with Veo
    console.log("3️⃣ Calling Veo 3.1");

    let operation = await ai.models.generateVideos({
      model: "veo-3.1-generate-001",

      source: {
        prompt,

        image: {
          imageBytes: imageBytes.toString("base64"),
          mimeType: "image/png",
        },
      },

      config: {
        aspectRatio: project.aspectRatio || "9:16",
        numberOfVideos: 1,
        resolution: "720p",
      },
    });

    console.log("4️⃣ Video generation started");

    // 8. Poll operation
    while (!operation.done) {
      console.log("⏳ Waiting for Veo...");

      await new Promise((resolve) => setTimeout(resolve, 10000));

      operation = await ai.operations.getVideosOperation({
        operation,
      });
    }

    console.log("5️⃣ Veo operation completed");

    // 9. Get generated video

    if (operation.error) {
      throw new Error(
        "Video generation couldn't be completed for this image. Please try a different image.",
      );
    }

    if ((operation.response?.raiMediaFilteredCount ?? 0) > 0) {
      throw new Error(
        "Video generation was blocked by the AI safety system. Please try a different image.",
      );
    }

    const generatedVideo = operation.response?.generatedVideos?.[0]?.video;

    if (!generatedVideo?.videoBytes) {
      throw new Error("Video generation failed. Please try again.");
    }

    console.log("6️⃣ Video received from Veo");

    // 10. Convert base64 video to Buffer
    const videoBuffer = Buffer.from(generatedVideo.videoBytes, "base64");

    console.log(`7️⃣ Video buffer created: ${videoBuffer.length} bytes`);

    // 11. Create filename
    const fileName = `${userId}-${Date.now()}.mp4`;

    // 12. Upload video to ImageKit
    console.log("8️⃣ Uploading video to ImageKit");

    const uploadResult = await imagekit.upload({
      file: videoBuffer,
      fileName,
      folder: "/ugc/generated-videos",
    });

    console.log("9️⃣ Video uploaded successfully");

    // 13. Save video URL
    await prisma.project.update({
      where: {
        id: project.id,
      },

      data: {
        generatedVideo: uploadResult.url,
        isGenerating: false,
      },
    });

    console.log("🔟 Project updated successfully");

    // 14. Send response
    return res.json({
      message: "Video Generation completed",
      videoUrl: uploadResult.url,
    });
  } catch (error: any) {
    console.error("VIDEO GENERATION ERROR:", error);

    // Update project status
    try {
      await prisma.project.update({
        where: {
          id: projectId,
          userId,
        },

        data: {
          isGenerating: false,
          error: error.message,
        },
      });
    } catch (dbError) {
      console.error("Failed to update project after error:", dbError);
    }

    // Refund credits
    if (isCreditDeducted) {
      try {
        await prisma.user.update({
          where: {
            id: userId,
          },

          data: {
            credits: {
              increment: 10,
            },
          },
        });

        console.log("💰 10 credits refunded");
      } catch (refundError) {
        console.error("Failed to refund credits:", refundError);
      }
    }

    Sentry.captureException(error);

    return res.status(500).json({
      message: error.message || "Video generation failed",
    });
  }
};

export const getAllPublishedProjects = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { isPublished: true },
    });
    res.json({ projects });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (
  req: Request<{ projectId: string }>,
  res: Response,
) => {
  try {
    const userId = req.userId as string;
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    res.json({ message: "Project deleted" });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};


export const updateProjectScript = async (req: Request<{ projectId: string }>, res: Response) => {
  try {
    const userId = req.userId as string;
    const { projectId } = req.params;
    const { script, language } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(script !== undefined && { script }),
        ...(language !== undefined && { language }),
      },
    });

    res.json({ project: updated });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};