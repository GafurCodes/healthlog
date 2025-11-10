import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  CLIPVisionModelWithProjection,
  AutoProcessor,
  pipeline,
  RawImage,
} from "@huggingface/transformers";

// -----------------------
// Types
// -----------------------

export interface Neighbor {
  id?: string;
  score?: number | null;
  file_name?: string;
  split?: string;
  total_calories?: number;
  total_mass?: number;
  total_fat?: number;
  total_carb?: number;
  total_protein?: number;
  ingredients?: string[]; // Changed to string array to match Python
}

type ClipModelType = any; // from @xenova/transformers (no strict types)
type ClipProcessorType = any;

// -----------------------
// Config
// -----------------------

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PINECONE_INDEX_NAME = "nibble-index-768";

if (!PINECONE_API_KEY) {
  throw new Error("Missing PINECONE_API_KEY");
}
if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY");
}

// Pinecone
const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
export const index = pc.index(PINECONE_INDEX_NAME);

// Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
export const gemini = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// -----------------------
// CLIP model (ViT-L/14@336px) via @xenova/transformers
// -----------------------

let clipModelPromise: Promise<ClipModelType> | null = null;
let clipProcessorPromise: Promise<ClipProcessorType> | null = null;

async function loadClip(): Promise<{
  model: ClipModelType;
  processor: ClipProcessorType;
}> {
  if (!clipModelPromise) {
    // Use Xenova's converted CLIP model which has ONNX files available
    // Xenova models are pre-converted to ONNX format and guaranteed to work
    clipModelPromise = CLIPVisionModelWithProjection.from_pretrained(
      "Xenova/clip-vit-large-patch14-336",
      {
        device: "cpu",
        dtype: "int8",
      }
    );
    clipProcessorPromise = AutoProcessor.from_pretrained(
      "Xenova/clip-vit-large-patch14-336"
    );
  }

  const [model, processor] = await Promise.all([
    clipModelPromise,
    clipProcessorPromise,
  ]);

  return { model, processor };
}

// -----------------------
// Helpers
// -----------------------

function l2Normalize(vec: number[], eps: number = 1e-8): number[] {
  const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0)) || eps;
  return vec.map((x) => x / norm);
}

export function dot(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < len; i++) {
    s += a[i] * b[i];
  }
  return s;
}

// Extract ingredient names as string array (matching Python logic)
export function extractIngredientNames(ingredientsField: unknown): string[] {
  if (ingredientsField == null) return [];

  const names: string[] = [];

  // Handle JSON string (as stored in Pinecone metadata)
  let parsed: unknown = ingredientsField;
  if (typeof ingredientsField === "string") {
    try {
      parsed = JSON.parse(ingredientsField);
    } catch {
      // If not valid JSON, treat as string
      parsed = ingredientsField;
    }
  }

  if (Array.isArray(parsed)) {
    for (const it of parsed) {
      if (it && typeof it === "object" && "name" in it) {
        const name = (it as { name?: unknown }).name;
        if (name != null) names.push(String(name));
      } else if (it != null) {
        names.push(String(it));
      }
    }
  } else if (parsed && typeof parsed === "object" && "name" in parsed) {
    const name = (parsed as { name?: unknown }).name;
    if (name != null) names.push(String(name));
  } else if (parsed != null) {
    names.push(String(parsed));
  }

  return names;
}

export function ingredientsToText(ingredientsField: unknown): string {
  const names = extractIngredientNames(ingredientsField);
  return names
    .map((n) => n.trim().toLowerCase())
    .filter((n) => n.length > 0)
    .join(", ");
}

// -----------------------
// CLIP encoders
// -----------------------

interface EncodeImageOptions {
  tta?: boolean;
}

export async function encodeImageClipFromBase64(
  imageB64: string,
  _options: EncodeImageOptions = {}
): Promise<number[]> {
  const { model, processor } = await loadClip();

  const imageBuffer = Uint8Array.from(atob(imageB64), (c) => c.charCodeAt(0));
  const blob = new Blob([imageBuffer]);
  const image = await RawImage.fromBlob(blob);

  const inputs = await processor(image);

  const outputs = await model(inputs);
  // CLIPModel returns { image_embeds, text_embeds }
  const imageEmbeds: {
    data: Float32Array | number[];
  } = outputs.image_embeds;

  const embArr = Array.from(imageEmbeds.data);
  return l2Normalize(embArr); // [D], L2-normalized
}

export async function encodeTextClip(texts: string[]): Promise<number[][]> {
  const { model, processor } = await loadClip();

  const inputs = await processor(texts, {
    padding: true,
    truncation: true,
    return_tensors: "pt",
  });

  const outputs = await model(inputs);
  const textEmbeds: {
    data: Float32Array | number[];
    dims: [number, number];
  } = outputs.text_embeds;

  const data = Array.from(textEmbeds.data);
  const dim = textEmbeds.dims[1];

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    const start = i * dim;
    const slice = data.slice(start, start + dim);
    out.push(l2Normalize(slice));
  }

  return out; // [ [D], ... ]
}

// -----------------------
// Gemini inference (neighbors only, no image)
// -----------------------

export async function inferDishWithGemini(
  neighbors: Neighbor[]
): Promise<string | null> {
  const contextLines = neighbors;

  const prompt = [
    "You are given nearest-neighbor dishes for an input food photo. ",
    "Using ONLY the context below, produce a best-effort JSON with keys:\n",
    '  - "estimated_calories": number (kcal)\n',
    '  - "estimated_fat": number\n',
    '  - "estimated_proten": number\n',
    '  - "estimated_carbs": number\n',
    '  - "dish_title": string\n',
    '  - "description": string (1-2 sentences)\n',
    '  - "key_ingredients": array of strings (3-8 items)\n',
    "When estimating calories, prefer neighbors with similar ingredients ",
    "and macronutrients. If conflicting, average reasonable neighbors and ",
    "round to a sensible whole number.\n\n",
    `Context (top ${contextLines.length} neighbors):\n`,
    `${JSON.stringify(contextLines, null, 2)}\n\n`,
    "Return ONLY the JSON object, no extra text.",
  ].join("");

  try {
    const result = await gemini.generateContent(prompt);
    const text = result.response.text();
    return text || null;
  } catch (error) {
    console.error("[Gemini] generation failed:", error);
    return null;
  }
}
