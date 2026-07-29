<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import QuestionForm from "$lib/components/questions/QuestionForm.svelte";

  import {
    getTeacherQuestionDetailCached,
    getTeacherSubjectsCached,
    invalidateTeacherQuestionDataCaches,
    readTeacherQuestionDetailCache,
    readTeacherSubjectsCache,
  } from "$lib/cache/teacher-page-cache";

  import { createQuestionFormData } from "$lib/utils/question-form";

  import type {
    QuestionAnalyzePayload,
    QuestionFormPayload,
  } from "$lib/types/question-form";

  import type {
    TeacherAnalyzeQuestionResponse,
    TeacherMutateQuestionResponse,
    TeacherQuestionResponse,
    TeacherSubjectsResponse,
  } from "$lib/types/teacher";

  const id = $derived(page.params.id ?? "");

  const cachedSubjects = readTeacherSubjectsCache();

  const cachedQuestion = id ? readTeacherQuestionDetailCache(id) : null;

  let subjects = $state<TeacherSubjectsResponse["subjects"]>(
    cachedSubjects ?? [],
  );

  let question = $state<TeacherQuestionResponse["question"] | null>(
    cachedQuestion,
  );

  let loading = $state(!cachedSubjects || !cachedQuestion);

  let errorMessage = $state("");

  async function loadData() {
    if (!id) {
      errorMessage = "ID soal tidak valid.";

      loading = false;

      return;
    }

    if (subjects.length > 0 && question) {
      loading = false;

      return;
    }

    loading = true;
    errorMessage = "";

    try {
      const [nextSubjects, nextQuestion] = await Promise.all([
        subjects.length > 0
          ? Promise.resolve(subjects)
          : getTeacherSubjectsCached(),

        question
          ? Promise.resolve(question)
          : getTeacherQuestionDetailCached(id),
      ]);

      subjects = nextSubjects;
      question = nextQuestion;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat data soal.";
    } finally {
      loading = false;
    }
  }

  async function analyzeQuestion(payload: QuestionAnalyzePayload) {
    const result = await apiFetch<TeacherAnalyzeQuestionResponse>(
      "/teacher/questions/analyze",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    return result.result;
  }

  async function updateQuestion(payload: QuestionFormPayload) {
    if (!id) {
      throw new Error("ID soal tidak valid.");
    }

    const formData = createQuestionFormData(payload, "edit");

    const result = await apiFetch<TeacherMutateQuestionResponse>(
      `/teacher/questions/${id}`,
      {
        method: "PUT",
        body: formData,
      },
    );

    invalidateTeacherQuestionDataCaches(result.question.id);

    await goto(
      `/teacher/questions?bank=${encodeURIComponent(payload.subjectId)}`,
    );
  }

  onMount(() => {
    void loadData();
  });
</script>

{#if errorMessage}
  <div
    class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
  >
    {errorMessage}
  </div>
{:else if loading}
  <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <p class="text-sm font-semibold text-slate-500">Memuat soal...</p>
  </div>
{:else if question}
  <QuestionForm
    mode="edit"
    {subjects}
    initialQuestion={question}
    backHref="/teacher/questions"
    onAnalyze={analyzeQuestion}
    onSubmit={updateQuestion}
  />
{/if}
