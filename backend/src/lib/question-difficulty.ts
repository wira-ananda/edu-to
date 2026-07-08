import type {
  DifficultyLevel,
  WeightPriority,
} from "../generated/prisma/client.js";

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
];

const hardKeywords = [
  "analisis",
  "analisislah",
  "evaluasi",
  "evaluasilah",
  "prediksi",
  "simpulkan",
  "berdasarkan kasus",
  "studi kasus",
  "berdasarkan tabel",
  "berdasarkan grafik",
  "perhatikan wacana",
  "perhatikan gambar",
];

function includesAny(text: string, keywords: string[]) {
  return keywords.filter((keyword) => text.includes(keyword));
}

export function classifyQuestionDifficulty(
  questionText: string,
): DifficultyResult {
  const text = questionText.toLowerCase().trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  let score = 0;
  const detectedIndicators: string[] = [];

  const easyMatches = includesAny(text, easyKeywords);
  const mediumMatches = includesAny(text, mediumKeywords);
  const hardMatches = includesAny(text, hardKeywords);

  if (easyMatches.length > 0) {
    score += 1;
    detectedIndicators.push(
      ...easyMatches.map((keyword) => `keyword mudah: ${keyword}`),
    );
  }

  if (mediumMatches.length > 0) {
    score += 2;
    detectedIndicators.push(
      ...mediumMatches.map((keyword) => `keyword sedang: ${keyword}`),
    );
  }

  if (hardMatches.length > 0) {
    score += 3;
    detectedIndicators.push(
      ...hardMatches.map((keyword) => `keyword sulit: ${keyword}`),
    );
  }

  if (wordCount > 30) {
    score += 1;
    detectedIndicators.push("teks soal panjang");
  }

  if (
    text.includes("kasus") ||
    text.includes("wacana") ||
    text.includes("cerita")
  ) {
    score += 2;
    detectedIndicators.push("berbentuk konteks kasus atau wacana");
  }

  if (
    text.includes("tabel") ||
    text.includes("grafik") ||
    text.includes("data") ||
    text.includes("diagram")
  ) {
    score += 1;
    detectedIndicators.push("mengandung data, tabel, grafik, atau diagram");
  }

  if (detectedIndicators.length === 0) {
    score = 1;
    detectedIndicators.push("indikator khusus tidak terdeteksi");
  }

  if (score <= 2) {
    return {
      difficultyLevel: "LOW",
      difficultyScore: score,
      detectedIndicators,
    };
  }

  if (score <= 5) {
    return {
      difficultyLevel: "MEDIUM",
      difficultyScore: score,
      detectedIndicators,
    };
  }

  return {
    difficultyLevel: "HIGH",
    difficultyScore: score,
    detectedIndicators,
  };
}

export function getWeightFromPriority(priority: WeightPriority) {
  if (priority === "LOW") return 1;
  if (priority === "NORMAL") return 3;
  if (priority === "HIGH") return 5;
  return 7;
}
