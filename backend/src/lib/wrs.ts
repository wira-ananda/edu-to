import type { DifficultyLevel } from "../types/domain.ts";

export type WrsCandidate = {
  id: string;
  weight: number;
  difficultyLevel: DifficultyLevel;
};

export type WrsSelection<T extends WrsCandidate> = {
  selected: T;
  totalWeight: number;
  randomValue: number;
};

export function selectQuestionByWrs<T extends WrsCandidate>(
  candidates: T[],
): WrsSelection<T> {
  if (candidates.length === 0) {
    throw new Error("WRS candidates are empty");
  }

  const totalWeight = candidates.reduce((total, candidate) => {
    return total + candidate.weight;
  }, 0);

  if (totalWeight <= 0) {
    throw new Error("Total weight must be greater than zero");
  }

  const randomValue = Math.floor(Math.random() * totalWeight) + 1;

  let cumulativeWeight = 0;

  for (const candidate of candidates) {
    cumulativeWeight += candidate.weight;

    if (randomValue <= cumulativeWeight) {
      return {
        selected: candidate,
        totalWeight,
        randomValue,
      };
    }
  }

  const lastCandidate = candidates[candidates.length - 1];
  if (!lastCandidate) {
    throw new Error("WRS candidates are empty");
  }
  return {
    selected: lastCandidate,
    totalWeight,
    randomValue,
  };
}
