import type {
  QuestionFormMode,
  QuestionFormPayload,
} from "$lib/types/question-form";

export function createQuestionFormData(
  payload: QuestionFormPayload,
  mode: QuestionFormMode,
) {
  const formData = new FormData();

  formData.set("subjectId", payload.subjectId);
  formData.set("questionText", payload.questionText);
  formData.set("imageAltText", payload.imageAltText);

  formData.set("optionA", payload.optionA);
  formData.set("optionB", payload.optionB);
  formData.set("optionC", payload.optionC);
  formData.set("optionD", payload.optionD);

  formData.set("correctAnswer", payload.correctAnswer);
  formData.set("weightPriority", payload.weightPriority);

  if (mode === "edit") {
    formData.set("removeImage", String(payload.removeImage));
  }

  if (payload.imageFile) {
    formData.set("image", payload.imageFile);
  }

  return formData;
}
