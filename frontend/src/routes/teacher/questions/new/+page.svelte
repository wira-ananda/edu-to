<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import QuestionForm from "$lib/components/questions/QuestionForm.svelte";

  import {
    getTeacherSubjectsCached,
    invalidateTeacherQuestionDataCaches,
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
    TeacherSubjectsResponse,
  } from "$lib/types/teacher";

  const defaultSubjectId = $derived(
    page.url.searchParams.get("subjectId") ?? "",
  );

  const cachedSubjects = readTeacherSubjectsCache();

  let subjects = $state<TeacherSubjectsResponse["subjects"]>(
    cachedSubjects ?? [],
  );

  let loading = $state(cachedSubjects === null);

  let errorMessage = $state("");

  async function loadSubjects() {
    if (subjects.length > 0) {
      loading = false;

      return;
    }

    loading = true;
    errorMessage = "";

    try {
      subjects = await getTeacherSubjectsCached();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat bank soal.";
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

  async function createQuestion(payload: QuestionFormPayload) {
    const formData = createQuestionFormData(payload, "create");

    const result = await apiFetch<TeacherMutateQuestionResponse>(
      "/teacher/questions",
      {
        method: "POST",
        body: formData,
      },
    );

    invalidateTeacherQuestionDataCaches(result.question.id);

    await goto(
      `/teacher/questions?bank=${encodeURIComponent(payload.subjectId)}`,
    );
  }

  onMount(() => {
    void loadSubjects();
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
    <p class="text-sm font-semibold text-slate-500">Memuat bank soal...</p>
  </div>
{:else}
  <QuestionForm
    mode="create"
    {subjects}
    {defaultSubjectId}
    backHref="/teacher/questions"
    onAnalyze={analyzeQuestion}
    onSubmit={createQuestion}
  />
{/if}
