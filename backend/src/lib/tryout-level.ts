import type { DifficultyLevel } from "../generated/prisma/client";

const levels: DifficultyLevel[] = ["LOW", "MEDIUM", "HIGH"];

export function getRandomLevel(): DifficultyLevel {
  const index = Math.floor(Math.random() * levels.length);
  const level = levels[index];
  if (!level) {
    return "MEDIUM";
  }
  return level;
}

export function getRandomAvailableLevel(
  availableLevels: DifficultyLevel[],
): DifficultyLevel {
  if (availableLevels.length === 0) {
    return getRandomLevel();
  }

  const randomLevel = getRandomLevel();

  if (availableLevels.includes(randomLevel)) {
    return randomLevel;
  }

  const fallbackIndex = Math.floor(Math.random() * availableLevels.length);
  const fallbackLevel = availableLevels[fallbackIndex];
  if (!fallbackLevel) {
    return getRandomLevel();
  }
  return fallbackLevel;
}

export function updateLevelAfterAnswer(
  currentLevel: DifficultyLevel,
  isCorrect: boolean,
): DifficultyLevel {
  if (isCorrect) {
    if (currentLevel === "LOW") return "MEDIUM";
    if (currentLevel === "MEDIUM") return "HIGH";
    return "HIGH";
  }

  if (currentLevel === "HIGH") return "MEDIUM";
  if (currentLevel === "MEDIUM") return "LOW";
  return "LOW";
}
