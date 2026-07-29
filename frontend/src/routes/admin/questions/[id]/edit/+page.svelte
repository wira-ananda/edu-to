<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import QuestionForm from "$lib/components/questions/QuestionForm.svelte";

  import {
    getAdminQuestionBanksCached,
    invalidateAdminQuestionDataCaches,
    readAdminQuestionBanksCache,
  } from "$lib/cache/admin-page-cache";

  import { createQuestionFormData } from "$lib/utils/question-form";

  import type {
    AnalyzeResult,
    Question,
    QuestionBank,
  } from "$lib/types/questions";

  import type {
    QuestionAnalyzePayload,
    QuestionFormPayload,
  } from "$lib/types/question-form";

  type QuestionResponse = {
    ok: boolean;
    question: Question;
  };

  type AnalyzeQuestionResponse = {
    ok: boolean;
    result: AnalyzeResult;
  };

  const id = $derived(page.params.id ?? "");

  const cachedBanks = readAdminQuestionBanksCache();

  let subjects = $state<QuestionBank[]>(cachedBanks ?? []);

  let question = $state<Question | null>(null);

  let loading = $state(true);

  let errorMessage = $state("");

  async function loadData() {
    if (!id) {
      errorMessage = "ID soal tidak valid.";

      loading = false;

      return;
    }

    loading = true;
    errorMessage = "";

    try {
      const [nextSubjects, questionResult] = await Promise.all([
        subjects.length > 0
          ? Promise.resolve(subjects)
          : getAdminQuestionBanksCached(),

        apiFetch<QuestionResponse>(`/admin/questions/${id}`),
      ]);

      subjects = nextSubjects;

      question = questionResult.question;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat soal.";
    } finally {
      loading = false;
    }
  }

  async function analyzeQuestion(payload: QuestionAnalyzePayload) {
    const result = await apiFetch<AnalyzeQuestionResponse>(
      "/admin/questions/analyze",
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

    await apiFetch(`/admin/questions/${id}`, {
      method: "PUT",
      body: formData,
    });

    /*
     * Soal bisa berpindah bank saat diedit.
     * Clear semua question cache agar bank lama
     * dan bank baru sama-sama valid.
     */
    invalidateAdminQuestionDataCaches();

    await goto(
      `/admin/questions?bank=${encodeURIComponent(payload.subjectId)}`,
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
    backHref="/admin/questions"
    onAnalyze={analyzeQuestion}
    onSubmit={updateQuestion}
  />
{/if}
