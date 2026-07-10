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
  "uraikan",
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
  "hipotesis",
  "korelasi",
  "eksperimen",
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
  return value
    .toLowerCase()
    .replace(/[“”"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsKeyword(text: string, keyword: string) {
  const escapedKeyword = escapeRegExp(keyword);

  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapedKeyword}($|[^a-z0-9])`,
    "i",
  );

  return pattern.test(text);
}

function collectKeywordMatches(text: string, keywords: string[]) {
  return keywords.filter((keyword) => containsKeyword(text, keyword));
}

function getDifficultyInputPayload(input: DifficultyInput) {
  if (typeof input === "string") {
    return {
      questionText: input,
      imageAltText: "",
      hasImage: false,
    };
  }

  return {
    questionText: input.questionText,
    imageAltText: input.imageAltText ?? "",
    hasImage: Boolean(input.hasImage),
  };
}

function addIndicator(indicators: Set<string>, indicator: string) {
  indicators.add(indicator);
}

export function classifyQuestionDifficulty(
  input: DifficultyInput,
): DifficultyResult {
  const payload = getDifficultyInputPayload(input);

  const normalizedQuestionText = normalizeText(payload.questionText);

  const normalizedImageAltText = payload.hasImage
    ? normalizeText(payload.imageAltText)
    : "";

  const combinedText = normalizeText(
    `${normalizedQuestionText} ${normalizedImageAltText}`,
  );

  const easyMatches = collectKeywordMatches(combinedText, easyKeywords);

  const mediumMatches = collectKeywordMatches(combinedText, mediumKeywords);

  const textForHardMatching = mediumMatches.includes("analisis sederhana")
    ? combinedText.replaceAll("analisis sederhana", " ")
    : combinedText;

  const hardMatches = collectKeywordMatches(textForHardMatching, hardKeywords);

  const visualMatches = collectKeywordMatches(combinedText, visualKeywords);

  const detectedIndicators = new Set<string>();
  let difficultyScore = 0;

  for (const keyword of easyMatches) {
    addIndicator(detectedIndicators, `Kata kerja tingkat mudah: ${keyword}`);
  }

  for (const keyword of mediumMatches) {
    difficultyScore += 2;

    addIndicator(detectedIndicators, `Kata kerja tingkat sedang: ${keyword}`);
  }

  for (const keyword of hardMatches) {
    difficultyScore += 3;

    addIndicator(detectedIndicators, `Kata kerja tingkat sulit: ${keyword}`);
  }

  if (payload.hasImage) {
    difficultyScore += 1;

    addIndicator(detectedIndicators, "Soal memiliki gambar pendukung");
  }

  if (payload.hasImage && visualMatches.length > 0) {
    difficultyScore += 1;

    addIndicator(
      detectedIndicators,
      `Membutuhkan interpretasi visual: ${visualMatches.join(", ")}`,
    );
  }

  const wordCount = normalizedQuestionText.split(" ").filter(Boolean).length;

  if (wordCount >= 35) {
    difficultyScore += 1;

    addIndicator(detectedIndicators, "Teks soal cukup panjang");
  }

  if (wordCount >= 60) {
    difficultyScore += 1;

    addIndicator(detectedIndicators, "Teks soal sangat panjang");
  }

  if (/\d/.test(normalizedQuestionText)) {
    difficultyScore += 1;

    addIndicator(detectedIndicators, "Mengandung angka atau data numerik");
  }

  if (detectedIndicators.size === 0) {
    addIndicator(
      detectedIndicators,
      "Tidak ditemukan indikator kesulitan khusus",
    );
  }

  let difficultyLevel: DifficultyLevel = "LOW";

  if (difficultyScore >= 5) {
    difficultyLevel = "HIGH";
  } else if (difficultyScore >= 2) {
    difficultyLevel = "MEDIUM";
  }

  return {
    difficultyLevel,
    difficultyScore,
    detectedIndicators: Array.from(detectedIndicators),
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
    NORMAL: 3,
    HIGH: 5,
    VERY_HIGH: 7,
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
