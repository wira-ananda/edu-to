import type { DifficultyLevel, Question } from "$lib/types/questions";

export type QuestionBankManagementBank = {
  id: string;
  name: string;

  totalQuestions: number;

  difficultyCounts?: Partial<Record<DifficultyLevel, number>> | null;
};

export type QuestionBankManagementQuestion = Pick<
  Question,
  | "id"
  | "subjectId"
  | "questionText"
  | "imageUrl"
  | "difficultyLevel"
  | "weightPriority"
  | "weight"
>;
