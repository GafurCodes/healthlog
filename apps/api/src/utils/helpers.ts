import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CLIPModel, AutoProcessor } from "@xenova/transformers";
import sharp from "sharp";

// -----------------------
// Types
// -----------------------

export interface Neighbor {
  id?: string;
  score_image?: number | null;
  file_name?: string;
  split?: string;
  total_calories?: number;
  total_mass?: number;
  total_fat?: number;
  total_carb?: number;
  total_protein?: number;
  ingredients?: Array<string | { name?: string }>;
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
    clipModelPromise = CLIPModel.from_pretrained(
      "Xenova/clip-vit-large-patch14-336"
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

export function ingredientsToText(ingredientsField: unknown): string {
  if (ingredientsField == null) return "";

  const names: string[] = [];

  if (Array.isArray(ingredientsField)) {
    for (const it of ingredientsField) {
      if (it && typeof it === "object" && "name" in it) {
        const name = (it as { name?: unknown }).name;
        names.push(String(name));
      } else {
        names.push(String(it));
      }
    }
  } else if (
    ingredientsField &&
    typeof ingredientsField === "object" &&
    "name" in ingredientsField
  ) {
    const name = (ingredientsField as { name?: unknown }).name;
    names.push(String(name));
  } else {
    names.push(String(ingredientsField));
  }

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
  { tta = true }: EncodeImageOptions = {}
): Promise<number[]> {
  const { model, processor } = await loadClip();

  const base = Buffer.from(imageB64, "base64");
  const images: Buffer[] = [];

  // original
  images.push(base);

  // horizontal flip (TTA)
  if (tta) {
    const flipped = await sharp(base).flop().toBuffer(); // flop = horizontal flip
    images.push(flipped);
  }

  const embeddings: number[][] = [];

  for (const imgBuf of images) {
    const inputs = await processor(imgBuf, {
      return_tensors: "pt",
    });

    const outputs = await model(inputs);
    // CLIPModel returns { image_embeds, text_embeds }
    const imageEmbeds: {
      data: Float32Array | number[];
    } = outputs.image_embeds;

    const embArr = Array.from(imageEmbeds.data);
    const normEmb = l2Normalize(embArr);
    embeddings.push(normEmb);
  }

  if (embeddings.length === 0) {
    throw new Error("Failed to compute embeddings");
  }

  // average TTA embeddings
  const dim = embeddings[0].length;
  const avg = new Array<number>(dim).fill(0);

  for (const e of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += e[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    avg[i] /= embeddings.length;
  }

  return l2Normalize(avg); // [D], L2-normalized
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
// Gemini inference (neighbors + image)
// -----------------------

export async function inferDishWithGemini(
  imageB64: string,
  neighbors: Neighbor[]
): Promise<string> {
  const topNeighbors = neighbors.slice(0, 8);
  const payload = { neighbors: topNeighbors };
  const truncatedB64 = imageB64.slice(0, 8000);

  const prompt = [
    "You are an expert food recognition and nutrition assistant.",
    "You are given:",
    "1) A base64-encoded image of a single plated dish.",
    "2) A set of nearest-neighbor dishes from a labeled dataset, including their ingredients and nutrition facts.",
    "3) (Optional) An estimated macro profile derived from those neighbors.",
    "",
    "Using ONLY this information, infer a plausible guess of what the dish is.",
    "Focus on pattern-matching the neighbors (ingredients & style), not fantasy.",
    "",
    "Return STRICTLY a JSON object with keys:",
    '  - "dish_title": short human-friendly name for the dish',
    '  - "description": 1-2 concise sentences',
    '  - "key_ingredients": array of 3-10 important ingredients (lowercase strings)',
    '  - "total_calories": number',
    '  - "total_fat": number',
    '  - "total_carbs": number',
    '  - "total_protein": number',
    "If uncertain, pick the most reasonable guess and keep wording honest.",
    "Do not include any extra keys or commentary.",
    "",
    `Query image (base64, truncated): ${truncatedB64}`,
    "",
    "Neighbor context (JSON):",
    JSON.stringify(payload, null, 2),
  ].join("\n");

  const result = await gemini.generateContent(prompt);
  const text = result.response.text();

  return text; // caller can JSON.parse if desired
}
