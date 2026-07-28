<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import TeacherQuestionForm from "$lib/components/questions/TeacherQuestionForm.svelte";
  import {
    getTeacherQuestionDetailCached,
    getTeacherSubjectsCached,
    readTeacherQuestionDetailCache,
    readTeacherSubjectsCache,
  } from "$lib/cache/teacher-page-cache";
  import type {
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

      <p class="text-sm font-semibold text-slate-500">Memuat soal...</p>
    </div>
  </div>
{:else if question}
  <TeacherQuestionForm mode="edit" {subjects} initialQuestion={question} />
{/if}
