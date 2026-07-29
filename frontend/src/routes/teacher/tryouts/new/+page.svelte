<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import TryoutForm from "$lib/components/tryouts/TryoutForm.svelte";

  import {
    getTeacherSubjectsCached,
    invalidateTeacherTryoutsCache,
    readTeacherSubjectsCache,
  } from "$lib/cache/teacher-page-cache";

  import type { TryoutFormPayload } from "$lib/types/tryout-form";

  import type {
    TeacherCreateTryoutPayload,
    TeacherMutateTryoutResponse,
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

  let saving = $state(false);

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

  async function createTryout(values: TryoutFormPayload) {
    saving = true;

    errorMessage = "";

    try {
      const payload: TeacherCreateTryoutPayload = values;

      await apiFetch<TeacherMutateTryoutResponse>("/teacher/tryouts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      invalidateTeacherTryoutsCache();

      await goto("/teacher/tryouts");
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal membuat tryout.";
    } finally {
      saving = false;
    }
  }

  onMount(() => {
    void loadSubjects();
  });
</script>

{#if errorMessage && loading}
  <div
    class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
  >
    {errorMessage}
  </div>
{:else if loading}
  <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <div class="flex items-center gap-3">
      <div
        class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0c438c]"
      ></div>

      <p class="text-sm font-semibold text-slate-500">Memuat bank soal...</p>
    </div>
  </div>
{:else}
  <TryoutForm
    mode="create"
    {subjects}
    {defaultSubjectId}
    {saving}
    {errorMessage}
    backHref="/teacher/tryouts"
    questionBankHref="/teacher/questions"
    newQuestionHref="/teacher/questions/new"
    description="Buat paket tryout dari salah satu bank soal milikmu."
    onSubmit={createTryout}
  />
{/if}
