import dotenv from "dotenv";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in .env file.");
  process.exit(1);
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static("."));

const referenceImagesDir = path.join(process.cwd(), "assets", "neil");
const supportedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

app.get("/api/reference-images", async (_req, res) => {
  try {
    const entries = await fs.readdir(referenceImagesDir, { withFileTypes: true });
    const images = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => supportedExtensions.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        name,
        url: `/assets/neil/${encodeURIComponent(name)}`,
      }));

    return res.json({ images });
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return res.json({ images: [] });
    }
    const message = error?.message || "Failed to read backend images.";
    return res.status(500).json({ error: message });
  }
});

app.post("/api/generate-image", async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const scenePrompt = [
      `Create a photorealistic image of this location: ${prompt}.`,
      "No people, no faces, no portraits, no human figures.",
      "Focus on environment and atmosphere only.",
    ].join(" ");

    const imageResponse = await client.images.generate({
      model: "gpt-image-1",
      prompt: scenePrompt,
      size: "1024x1024",
    });

    const imageData = imageResponse.data?.[0];
    if (!imageData) {
      return res.status(502).json({ error: "No image returned by OpenAI." });
    }

    if (imageData.url) {
      return res.json({ imageUrl: imageData.url });
    }

    if (imageData.b64_json) {
      return res.json({ imageUrl: `data:image/png;base64,${imageData.b64_json}` });
    }

    return res.status(502).json({ error: "Unsupported OpenAI image response format." });
  } catch (error) {
    const message = error?.error?.message || error?.message || "Failed to generate image.";
    return res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`);
});
