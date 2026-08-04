import "../lib/env.js";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  classifyQuestionDifficulty,
  getWeightFromPriority,
} from "../lib/question-difficulty.js";

import type { WeightPriority } from "../types/domain.js";

type ReferenceDifficulty = "LOW" | "MEDIUM" | "HIGH";

type SeedQuestion = {
  questionNumber: number;
  topic: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  referenceDifficulty: ReferenceDifficulty;
  weightPriority: WeightPriority;
};

type SeedFile = {
  metadata: Record<string, unknown>;
  questions: SeedQuestion[];
};

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

const projectRoot = path.resolve(currentDirectory, "../../..");

const inputFile = path.join(
  projectRoot,
  "analytics",
  "data",
  "raw",
  "question-classification-seed.json",
);

const outputFile = path.join(
  projectRoot,
  "analytics",
  "data",
  "raw",
  "question-classification-results.json",
);

function normalizeIndicatorText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return JSON.stringify(item);
      })
      .join(" | ");
  }

  return JSON.stringify(value);
}

async function readSeedFile(): Promise<SeedFile> {
  const rawContent = await readFile(inputFile, "utf8");

  const parsedContent = JSON.parse(rawContent) as SeedFile;

  if (
    !Array.isArray(parsedContent.questions) ||
    parsedContent.questions.length === 0
  ) {
    throw new Error("Data questions pada JSON kosong atau tidak valid.");
  }

  return parsedContent;
}

async function main() {
  const seedFile = await readSeedFile();

  const questions = seedFile.questions.map((question) => {
    const classification = classifyQuestionDifficulty({
      questionText: question.questionText,
      imageAltText: null,
      hasImage: false,
    });

    const systemDifficulty = classification.difficultyLevel;

    const isMatch = question.referenceDifficulty === systemDifficulty;

    return {
      ...question,

      systemDifficulty,

      difficultyScore: classification.difficultyScore,

      detectedIndicators: classification.detectedIndicators,

      detectedIndicatorText: normalizeIndicatorText(
        classification.detectedIndicators,
      ),

      isMatch,

      weight: getWeightFromPriority(question.weightPriority),
    };
  });

  const matchedQuestions = questions.filter(
    (question) => question.isMatch,
  ).length;

  const result = {
    metadata: {
      ...seedFile.metadata,

      generatedAt: new Date().toISOString(),

      classifier: "classifyQuestionDifficulty",

      matchedQuestions,

      unmatchedQuestions: questions.length - matchedQuestions,

      accuracyPercent: (matchedQuestions / questions.length) * 100,
    },

    questions,
  };

  await writeFile(outputFile, JSON.stringify(result, null, 2), "utf8");

  const distribution = questions.reduce(
    (accumulator, question) => {
      accumulator[question.systemDifficulty] =
        (accumulator[question.systemDifficulty] ?? 0) + 1;

      return accumulator;
    },
    {} as Record<string, number>,
  );

  console.log("");
  console.log("Export klasifikasi soal selesai.");
  console.log(`Input : ${inputFile}`);
  console.log(`Output: ${outputFile}`);
  console.log(`Jumlah soal: ${questions.length}`);
  console.log(`Sesuai: ${matchedQuestions}`);
  console.log(`Tidak sesuai: ${questions.length - matchedQuestions}`);
  console.log(
    `Kesesuaian: ${((matchedQuestions / questions.length) * 100).toFixed(2)}%`,
  );
  console.log("");
  console.log("Distribusi hasil classifier:");
  console.table(distribution);
}

main().catch((error) => {
  console.error("Gagal mengekspor hasil klasifikasi:", error);

  process.exit(1);
});
