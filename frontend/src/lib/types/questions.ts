export type DifficultyLevel = "LOW" | "MEDIUM" | "HIGH";

export type WeightPriority = "LOW" | "NORMAL" | "HIGH" | "VERY_HIGH";

export type AnswerOption = "A" | "B" | "C" | "D";

export type Subject = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type QuestionBank = {
  id: string;
  name: string;
  totalQuestions: number;
  difficultyCounts: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
  };
  priorityCounts: {
    LOW: number;
    NORMAL: number;
    HIGH: number;
    VERY_HIGH: number;
  };
  createdAt: string;
  updatedAt: string;
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

  imageUrl: string | null;
  imagePath: string | null;
  imageAltText: string | null;

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

export type QuestionFormData = {
  subjectId: string;
  questionText: string;
  imageAltText?: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
  weightPriority: WeightPriority;
};

export type CreateQuestionPayload = QuestionFormData;

export type UpdateQuestionPayload = QuestionFormData & {
  removeImage?: boolean;
};

export type AnalyzeQuestionPayload = {
  questionText: string;
  imageAltText?: string | null;
  hasImage?: boolean;
  weightPriority: WeightPriority;
};

export type QuestionBanksResponse = {
  ok: boolean;
  banks: QuestionBank[];
};

export type QuestionsResponse = {
  ok: boolean;
  questions: Question[];
};

export type QuestionResponse = {
  ok: boolean;
  question: Question;
};

export type SubjectsResponse = {
  ok: boolean;
  subjects: Subject[];
};

export type AnalyzeQuestionResponse = {
  ok: boolean;
  result: AnalyzeResult;
};

export type MutateQuestionResponse = {
  ok: boolean;
  message: string;
  question: Question;
};

export const difficultyOptions: {
  value: DifficultyLevel;
  label: string;
}[] = [
  {
    value: "LOW",
    label: "Mudah",
  },
  {
    value: "MEDIUM",
    label: "Sedang",
  },
  {
    value: "HIGH",
    label: "Sulit",
  },
];

export const weightPriorityOptions: {
  value: WeightPriority;
  label: string;
  weight: number;
}[] = [
  {
    value: "LOW",
    label: "Rendah",
    weight: 1,
  },
  {
    value: "NORMAL",
    label: "Normal",
    weight: 3,
  },
  {
    value: "HIGH",
    label: "Tinggi",
    weight: 5,
  },
  {
    value: "VERY_HIGH",
    label: "Sangat Tinggi",
    weight: 7,
  },
];

export const answerOptions: AnswerOption[] = ["A", "B", "C", "D"];

export function getDifficultyLabel(level: DifficultyLevel) {
  if (level === "LOW") return "Mudah";
  if (level === "MEDIUM") return "Sedang";

  return "Sulit";
}

export function getDifficultyBadgeClass(level: DifficultyLevel) {
  if (level === "LOW") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (level === "MEDIUM") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-red-50 text-red-700";
}

export function getWeightPriorityLabel(priority: WeightPriority) {
  if (priority === "LOW") return "Rendah";
  if (priority === "NORMAL") return "Normal";
  if (priority === "HIGH") return "Tinggi";

  return "Sangat Tinggi";
}

export function getWeightFromPriority(priority: WeightPriority) {
  if (priority === "LOW") return 1;
  if (priority === "NORMAL") return 3;
  if (priority === "HIGH") return 5;

  return 7;
}

export function getWeightProgressWidth(weight: number) {
  const maxWeight = 7;
  const safeWeight = Math.max(1, Math.min(weight, maxWeight));

  return `${(safeWeight / maxWeight) * 100}%`;
}

export function getQuestionShortId(index: number) {
  return `Q-${String(index + 1).padStart(3, "0")}`;
}
