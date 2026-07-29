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

  import type { AnalyzeResult, QuestionBank } from "$lib/types/questions";

  import type {
    QuestionAnalyzePayload,
    QuestionFormPayload,
  } from "$lib/types/question-form";

  type AnalyzeQuestionResponse = {
    ok: boolean;
    result: AnalyzeResult;
  };

  const defaultSubjectId = $derived(
    page.url.searchParams.get("subjectId") ?? "",
  );

  const cachedBanks = readAdminQuestionBanksCache();

  let subjects = $state<QuestionBank[]>(cachedBanks ?? []);

  let loading = $state(cachedBanks === null);

  let errorMessage = $state("");

  async function loadSubjects() {
    if (subjects.length > 0) {
      loading = false;

      return;
    }

    loading = true;
    errorMessage = "";

    try {
      subjects = await getAdminQuestionBanksCached();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat bank soal.";
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

  async function createQuestion(payload: QuestionFormPayload) {
    const formData = createQuestionFormData(payload, "create");

    await apiFetch("/admin/questions", {
      method: "POST",
      body: formData,
    });

    invalidateAdminQuestionDataCaches();

    await goto(
      `/admin/questions?bank=${encodeURIComponent(payload.subjectId)}`,
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
    backHref="/admin/questions"
    onAnalyze={analyzeQuestion}
    onSubmit={createQuestion}
  />
{/if}
