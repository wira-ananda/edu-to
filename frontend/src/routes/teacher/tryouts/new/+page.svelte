<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import TeacherTryoutForm from "$lib/components/tryouts/TeacherTryoutForm.svelte";
  import {
    getTeacherSubjectsCached,
    readTeacherSubjectsCache,
  } from "$lib/cache/teacher-page-cache";
  import type { TeacherSubjectsResponse } from "$lib/types/teacher";

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
    <div class="flex items-center gap-3">
      <div
        class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0c438c]"
      ></div>

      <p class="text-sm font-semibold text-slate-500">Memuat bank soal...</p>
    </div>
  </div>
{:else}
  <TeacherTryoutForm mode="create" {subjects} {defaultSubjectId} />
{/if}
