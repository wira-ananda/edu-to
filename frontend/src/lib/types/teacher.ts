import type {
  AnalyzeQuestionPayload,
  AnalyzeQuestionResponse,
  MutateQuestionResponse,
  Question,
  QuestionBank,
  QuestionFormData,
  QuestionsResponse,
  QuestionResponse,
  Subject,
  SubjectsResponse,
} from "./questions";
import type {
  CreateTryoutPayload,
  MutateTryoutResponse,
  TryoutResultsResponse,
  TryoutStatisticsResponse,
  UpdateTryoutPayload,
  UpdateTryoutStatusPayload,
  AdminTryoutItem,
  AdminTryoutResponse,
  AdminTryoutsResponse,
} from "./admin";

export type TeacherSubject = Subject;

export type TeacherQuestion = Question;

export type TeacherQuestionBank = QuestionBank;

export type TeacherTryoutItem = AdminTryoutItem;

export type TeacherSubjectsResponse = SubjectsResponse;

export type TeacherQuestionsResponse = QuestionsResponse;

export type TeacherQuestionResponse = QuestionResponse;

export type TeacherQuestionBanksResponse = {
  ok: boolean;
  banks: TeacherQuestionBank[];
};

export type TeacherAnalyzeQuestionPayload = AnalyzeQuestionPayload;

export type TeacherAnalyzeQuestionResponse = AnalyzeQuestionResponse;

export type TeacherQuestionFormData = QuestionFormData;

export type TeacherMutateQuestionResponse = MutateQuestionResponse;

export type TeacherTryoutsResponse = AdminTryoutsResponse;

export type TeacherTryoutResponse = AdminTryoutResponse;

export type TeacherCreateTryoutPayload = CreateTryoutPayload;

export type TeacherUpdateTryoutPayload = UpdateTryoutPayload;

export type TeacherUpdateTryoutStatusPayload = UpdateTryoutStatusPayload;

export type TeacherMutateTryoutResponse = MutateTryoutResponse;

export type TeacherTryoutResultsResponse = TryoutResultsResponse;

export type TeacherTryoutStatisticsResponse = TryoutStatisticsResponse;
