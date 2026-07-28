<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import TeacherTryoutForm from "$lib/components/tryouts/TeacherTryoutForm.svelte";
  import {
    getTeacherSubjectsCached,
    getTeacherTryoutDetailCached,
    readTeacherSubjectsCache,
    readTeacherTryoutDetailCache,
  } from "$lib/cache/teacher-page-cache";
  import type {
    TeacherSubjectsResponse,
    TeacherTryoutResponse,
  } from "$lib/types/teacher";

  const id = $derived(page.params.id ?? "");

  const cachedSubjects = readTeacherSubjectsCache();

  const cachedTryout = id ? readTeacherTryoutDetailCache(id) : null;

  let subjects = $state<TeacherSubjectsResponse["subjects"]>(
    cachedSubjects ?? [],
  );

  let tryout = $state<TeacherTryoutResponse["tryout"] | null>(cachedTryout);

  let loading = $state(!cachedSubjects || !cachedTryout);

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
    <div class="flex items-center gap-3">
      <div
        class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0c438c]"
      ></div>

      <p class="text-sm font-semibold text-slate-500">Memuat tryout...</p>
    </div>
  </div>
{:else if tryout}
  <TeacherTryoutForm mode="edit" {subjects} initialTryout={tryout} />
{/if}
