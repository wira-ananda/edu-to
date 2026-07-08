import type { DifficultyLevel, WeightPriority } from "../types/domain.js";

export type DifficultyInput =
  | string
  | {
      questionText: string;
      imageAltText?: string | null;
      hasImage?: boolean;
    };

export type DifficultyResult = {
  difficultyLevel: DifficultyLevel;
  difficultyScore: number;
  detectedIndicators: string[];
};

const easyKeywords = [
  "apa",
  "siapa",
  "sebutkan",
  "pengertian",
  "definisi",
  "ciri-ciri",
  "fungsi",
  "contoh",
  "identifikasi",
];

const mediumKeywords = [
  "jelaskan",
  "bandingkan",
  "bedakan",
  "hubungan",
  "penyebab",
  "akibat",
  "proses",
  "mengapa",
  "tentukan",
  "klasifikasikan",
  "analisis sederhana",
];

const hardKeywords = [
  "analisis",
  "evaluasi",
  "simpulkan",
  "buktikan",
  "prediksi",
  "strategi",
  "kritisi",
  "argumentasikan",
  "interpretasikan",
  "hubungkan dengan",
  "studi kasus",
  "pemecahan masalah",
];

const visualKeywords = [
  "gambar",
  "grafik",
  "tabel",
  "diagram",
  "bagan",
  "kurva",
  "data",
  "peta",
  "struktur",
  "ilustrasi",
  "perhatikan",
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getDifficultyInputPayload(input: DifficultyInput) {
  if (typeof input === "string") {
    return {
      questionText: input,
      imageAltText: null,
      hasImage: false,
    };
  }

  return {
    questionText: input.questionText,
    imageAltText: input.imageAltText ?? null,
    hasImage: Boolean(input.hasImage),
  };
}

function collectKeywordMatches(text: string, keywords: string[]) {
  return keywords.filter((keyword) => text.includes(keyword));
}

export function classifyQuestionDifficulty(
  input: DifficultyInput,
): DifficultyResult {
  const payload = getDifficultyInputPayload(input);

  const questionText = normalizeText(payload.questionText);
  const imageAltText = normalizeText(payload.imageAltText ?? "");
  const combinedText = normalizeText(`${questionText} ${imageAltText}`);

  const easyMatches = collectKeywordMatches(combinedText, easyKeywords);
  const mediumMatches = collectKeywordMatches(combinedText, mediumKeywords);
  const hardMatches = collectKeywordMatches(combinedText, hardKeywords);
  const visualMatches = collectKeywordMatches(combinedText, visualKeywords);

  let difficultyScore = 0;
  const detectedIndicators: string[] = [];

  if (easyMatches.length > 0) {
    difficultyScore += easyMatches.length;
    detectedIndicators.push(...easyMatches.map((keyword) => `easy:${keyword}`));
  }

  if (mediumMatches.length > 0) {
    difficultyScore += mediumMatches.length * 2;
    detectedIndicators.push(
      ...mediumMatches.map((keyword) => `medium:${keyword}`),
    );
  }

  if (hardMatches.length > 0) {
    difficultyScore += hardMatches.length * 3;
    detectedIndicators.push(...hardMatches.map((keyword) => `hard:${keyword}`));
  }

  if (payload.hasImage) {
    difficultyScore += 1;
    detectedIndicators.push("visual:has-image");
  }

  if (payload.hasImage && visualMatches.length > 0) {
    difficultyScore += visualMatches.length;
    detectedIndicators.push(
      ...visualMatches.map((keyword) => `visual:${keyword}`),
    );
  }

  if (combinedText.length > 180) {
    difficultyScore += 1;
    detectedIndicators.push("text:length-medium");
  }

  if (combinedText.length > 320) {
    difficultyScore += 1;
    detectedIndicators.push("text:length-long");
  }

  let difficultyLevel: DifficultyLevel = "LOW";

  if (difficultyScore >= 6) {
    difficultyLevel = "HIGH";
  } else if (difficultyScore >= 3) {
    difficultyLevel = "MEDIUM";
  }

  return {
    difficultyLevel,
    difficultyScore,
    detectedIndicators,
  };
}

export function getQuestionDifficulty(input: DifficultyInput): DifficultyLevel {
  return classifyQuestionDifficulty(input).difficultyLevel;
}

export function getDifficultyLevel(input: DifficultyInput): DifficultyLevel {
  return classifyQuestionDifficulty(input).difficultyLevel;
}

export function detectQuestionDifficulty(
  input: DifficultyInput,
): DifficultyResult {
  return classifyQuestionDifficulty(input);
}

export function analyzeQuestionDifficulty(
  input: DifficultyInput,
): DifficultyResult {
  return classifyQuestionDifficulty(input);
}

export function getWeightByPriority(priority: WeightPriority) {
  const weightMap: Record<WeightPriority, number> = {
    LOW: 1,
    NORMAL: 2,
    HIGH: 3,
    VERY_HIGH: 4,
  };

  return weightMap[priority];
}

export function getWeightFromPriority(priority: WeightPriority) {
  return getWeightByPriority(priority);
}

export function getQuestionWeight(priority: WeightPriority) {
  return getWeightByPriority(priority);
}

export function mapWeightPriorityToWeight(priority: WeightPriority) {
  return getWeightByPriority(priority);
}
