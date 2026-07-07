export type DifficultyLevel = "LOW" | "MEDIUM" | "HIGH";
export type WeightPriority = "LOW" | "NORMAL" | "HIGH" | "VERY_HIGH";
export type AnswerOption = "A" | "B" | "C" | "D";

export type Subject = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Question = {
  id: string;
  subjectId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
  difficultyLevel: DifficultyLevel;
  difficultyScore: number;
  detectedIndicators: string[];
  weightPriority: WeightPriority;
  weight: number;
  createdAt: string;
  updatedAt: string;
  subject: Subject;
};

export type AnalyzeResult = {
  difficultyLevel: DifficultyLevel;
  difficultyScore: number;
  detectedIndicators: string[];
  weightPriority: WeightPriority;
  weight: number;
};
