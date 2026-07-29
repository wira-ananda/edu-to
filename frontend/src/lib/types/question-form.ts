import type {
  AnalyzeResult,
  AnswerOption,
  DifficultyLevel,
  WeightPriority,
} from "$lib/types/questions";

export type QuestionFormMode = "create" | "edit";

export type QuestionFormSubject = {
  id: string;
  name: string;
};

export type QuestionFormInitialValue = {
  id: string;
  subjectId: string;

  questionText: string;

  imageAltText: string | null;
  imageUrl: string | null;

  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;

  correctAnswer: AnswerOption;
  weightPriority: WeightPriority;

  difficultyLevel: DifficultyLevel;
  difficultyScore: number;
  detectedIndicators: string[];

  weight: number;
};

export type QuestionAnalyzePayload = {
  questionText: string;
  imageAltText: string | null;
  hasImage: boolean;
  weightPriority: WeightPriority;
};

export type QuestionFormPayload = {
  subjectId: string;

  questionText: string;
  imageAltText: string;

  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;

  correctAnswer: AnswerOption;
  weightPriority: WeightPriority;

  imageFile: File | null;
  removeImage: boolean;
};

export type QuestionAnalyzeHandler = (
  payload: QuestionAnalyzePayload,
) => Promise<AnalyzeResult>;

export type QuestionSubmitHandler = (
  payload: QuestionFormPayload,
) => Promise<void>;
