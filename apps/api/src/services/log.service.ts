import { Log, ILog } from "../models/Log.js";
import {
  CreateLogInput,
  UpdateLogInput,
  SearchLogsInput,
} from "../utils/validation.js";

import {
  encodeImageClipFromBase64,
  inferDishWithGemini,
  index,
  extractIngredientNames,
} from "../utils/helpers.js";

import type { Neighbor } from "../utils/helpers.js";

interface PineconeMatch {
  id?: string;
  score?: number;
  metadata?: {
    file_name?: string;
    split?: string;
    total_calories?: number;
    total_mass?: number;
    total_fat?: number;
    total_carb?: number;
    total_protein?: number;
    ingredients?: Array<string | { name?: string }> | unknown;
    [key: string]: unknown;
  };
}

export interface LogDTO {
  id: string;
  userId: string;
  type: "meal" | "workout" | "sleep";
  metrics: ILog["metrics"];
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogsResponse {
  data: LogDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function mapLog(doc: ILog): LogDTO {
  return {
    id: (doc as any)._id.toString(),
    userId: (doc.userId as any).toString(),
    type: doc.type,
    metrics: doc.metrics,
    date: new Date(doc.date).toISOString(),
    notes: doc.notes,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export async function createLog(
  userId: string,
  data: CreateLogInput
): Promise<{ data: LogDTO }> {
  const doc = await Log.create({
    userId,
    type: data.type,
    metrics: data.metrics,
    date: data.date ? new Date(data.date) : new Date(),
    notes: data.notes,
  });
  return { data: mapLog(doc) };
}

export async function getLogById(
  userId: string,
  logId: string
): Promise<{ data: LogDTO }> {
  const doc = await Log.findOne({ _id: logId, userId });
  if (!doc) {
    throw new Error("Log not found");
  }
  return { data: mapLog(doc) };
}

export async function updateLog(
  userId: string,
  logId: string,
  data: UpdateLogInput
): Promise<{ data: LogDTO }> {
  const doc = await Log.findOne({ _id: logId, userId });
  if (!doc) {
    throw new Error("Log not found");
  }
  if (data.type !== undefined) doc.type = data.type;
  if (data.metrics !== undefined) doc.metrics = data.metrics;
  if (data.date !== undefined) doc.date = new Date(data.date);
  if (data.notes !== undefined) doc.notes = data.notes;
  await doc.save();
  return { data: mapLog(doc) };
}

export async function deleteLog(
  userId: string,
  logId: string
): Promise<{ deleted: boolean; id: string }> {
  const result = await Log.deleteOne({ _id: logId, userId });
  return { deleted: result.deletedCount === 1, id: logId };
}

export async function searchLogs(
  userId: string,
  query: SearchLogsInput
): Promise<LogsResponse> {
  const { type, startDate, endDate, page, pageSize } = query;
  const filter: Record<string, any> = { userId };

  if (type) filter.type = type;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const total = await Log.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const skip = (page - 1) * pageSize;

  const docs = await Log.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  return {
    data: docs.map(mapLog),
    page,
    pageSize,
    total,
    totalPages,
  };
}

export async function getDailyCaloriesConsumed(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ 
  caloriesConsumed: number;
  protein: number;
  carbs: number;
  fat: number;
}> {
  const filter: Record<string, any> = {
    userId,
    type: "meal",
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  const mealLogs = await Log.find(filter);

  let caloriesConsumed = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  for (const log of mealLogs) {
    const metrics = log.metrics as any;
    if (metrics?.calories && typeof metrics.calories === "number") {
      caloriesConsumed += metrics.calories;
    }
    if (metrics?.protein && typeof metrics.protein === "number") {
      protein += metrics.protein;
    }
    if (metrics?.carbs && typeof metrics.carbs === "number") {
      carbs += metrics.carbs;
    }
    if (metrics?.fat && typeof metrics.fat === "number") {
      fat += metrics.fat;
    }
  }

  return { caloriesConsumed, protein, carbs, fat };
}

// -----------------------
// testIndex: image search -> neighbors + Gemini summary
// -----------------------
export async function getDishInfoFromImage(
  imageB64: string,
  topK: number = 10
): Promise<{ neighbors: Neighbor[]; gemini_summary: string | null }> {
  if (!imageB64) {
    throw new Error("imageB64 is required");
  }

  // basic base64 validation
  try {
    Buffer.from(imageB64, "base64");
  } catch {
    throw new Error("image_b64 is not valid base64");
  }

  // 1) Encode query image using CLIP
  const queryVec = await encodeImageClipFromBase64(imageB64);

  // 2) Search Pinecone index for k nearest results
  const resp = await index.query({
    vector: queryVec,
    topK: Number(topK),
    includeMetadata: true,
    includeValues: false,
  });

  const matches: PineconeMatch[] = resp.matches ?? [];
  if (!matches.length) {
    return { neighbors: [], gemini_summary: null };
  }

  // 3) Build neighbor context lines (matching Python logic)
  const contextLines: Neighbor[] = [];

  for (const m of matches) {
    const meta = m.metadata ?? {};
    const ingredientsRaw = meta.ingredients;

    // Extract ingredient names as string array
    const ingNames = extractIngredientNames(ingredientsRaw);

    contextLines.push({
      id: m.id,
      score: typeof m.score === "number" ? m.score : null,
      file_name: meta.file_name,
      split: meta.split,
      total_calories: meta.total_calories,
      total_mass: meta.total_mass,
      total_fat: meta.total_fat,
      total_carb: meta.total_carb,
      total_protein: meta.total_protein,
      ingredients: ingNames,
    });
  }

  // 4) Ask Gemini using neighbors context (no image)
  const geminiSummary = await inferDishWithGemini(contextLines);

  console.log("geminiSummary: ", geminiSummary);

  return {
    neighbors: contextLines,
    gemini_summary: geminiSummary,
  };
}
