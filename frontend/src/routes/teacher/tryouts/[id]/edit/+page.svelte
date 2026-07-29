<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import TryoutForm from "$lib/components/tryouts/TryoutForm.svelte";

  import {
    getTeacherSubjectsCached,
    getTeacherTryoutDetailCached,
    invalidateTeacherTryoutRelatedCaches,
    readTeacherSubjectsCache,
    readTeacherTryoutDetailCache,
  } from "$lib/cache/teacher-page-cache";

  import type { TryoutFormPayload } from "$lib/types/tryout-form";

  import type {
    TeacherMutateTryoutResponse,
    TeacherSubjectsResponse,
    TeacherTryoutResponse,
    TeacherUpdateTryoutPayload,
  } from "$lib/types/teacher";

  const id = $derived(page.params.id ?? "");

  const cachedSubjects = readTeacherSubjectsCache();

  const cachedTryout = id ? readTeacherTryoutDetailCache(id) : null;

  let subjects = $state<TeacherSubjectsResponse["subjects"]>(
    cachedSubjects ?? [],
  );

  let tryout = $state<TeacherTryoutResponse["tryout"] | null>(cachedTryout);

  let loading = $state(!cachedSubjects || !cachedTryout);

  let saving = $state(false);

  let errorMessage = $state("");

  async function loadData() {
    if (!id) {
      errorMessage = "ID tryout tidak valid.";

      loading = false;

      return;
    }

    if (subjects.length > 0 && tryout) {
      loading = false;

      return;
    }

    loading = true;

    errorMessage = "";

    try {
      const [nextSubjects, nextTryout] = await Promise.all([
        subjects.length > 0
          ? Promise.resolve(subjects)
          : getTeacherSubjectsCached(),

        tryout ? Promise.resolve(tryout) : getTeacherTryoutDetailCached(id),
      ]);

      subjects = nextSubjects;

      tryout = nextTryout;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat tryout.";
    } finally {
      loading = false;
    }
  }

  async function updateTryout(values: TryoutFormPayload) {
    if (!id) {
      errorMessage = "ID tryout tidak valid.";

      return;
    }

    saving = true;

    errorMessage = "";

    try {
      const payload: TeacherUpdateTryoutPayload = values;

      await apiFetch<TeacherMutateTryoutResponse>(`/teacher/tryouts/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      invalidateTeacherTryoutRelatedCaches(id);

      await goto("/teacher/tryouts");
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memperbarui tryout.";
    } finally {
      saving = false;
    }
  }

  onMount(() => {
    void loadData();
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

      <p class="text-sm font-semibold text-slate-500">Memuat tryout...</p>
    </div>
  </div>
{:else if tryout}
  <TryoutForm
    mode="edit"
    {subjects}
    initialTryout={tryout}
    {saving}
    {errorMessage}
    backHref="/teacher/tryouts"
    questionBankHref="/teacher/questions"
    newQuestionHref="/teacher/questions/new"
    description="Perbarui konfigurasi paket tryout milikmu."
    onSubmit={updateTryout}
  />
{/if}
