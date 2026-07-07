<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type { AnswerOption } from "$lib/types/questions";
  import type {
    NextQuestionResponse,
    StudentQuestion,
    SubmitAnswerResponse,
  } from "$lib/types/student";
  import { getDifficultyLabel } from "$lib/types/questions";

  const sessionId = $derived(page.params.sessionId);

  let loading = $state(true);
  let submitting = $state(false);
  let errorMessage = $state("");
  let question = $state<StudentQuestion | null>(null);
  let selectedAnswer = $state<AnswerOption | "">("");
  let session = $state<NextQuestionResponse["session"] | null>(null);

  async function loadNextQuestion() {
    loading = true;
    errorMessage = "";
    selectedAnswer = "";

    try {
      const result = await apiFetch<NextQuestionResponse>(
        `/student/sessions/${sessionId}/next-question`,
      );

      if (result.finished) {
        await goto(`/student/results/${sessionId}`);
        return;
      }

      question = result.question ?? null;
      session = result.session ?? null;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat soal.";
    } finally {
      loading = false;
    }
  }

  async function submitAnswer() {
    if (!question) return;

    if (!selectedAnswer) {
      errorMessage = "Pilih jawaban terlebih dahulu.";
      return;
    }

    submitting = true;
    errorMessage = "";

    try {
      const result = await apiFetch<SubmitAnswerResponse>(
        `/student/sessions/${sessionId}/answer`,
        {
          method: "POST",
          body: JSON.stringify({
            questionId: question.id,
            selectedAnswer,
          }),
        },
      );

      if (result.finished) {
        await goto(`/student/results/${sessionId}`);
        return;
      }

      await loadNextQuestion();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal mengirim jawaban.";
    } finally {
      submitting = false;
    }
  }

  function optionClass(answer: AnswerOption) {
    return selectedAnswer === answer
      ? "border-blue-900 bg-blue-50 text-blue-950"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  }

  onMount(loadNextQuestion);
</script>

<section class="space-y-5">
  <div class="flex items-start justify-between">
    <div>
      <h2 class="text-2xl font-bold text-slate-950">Tryout Berlangsung</h2>

      <p class="mt-1 text-sm text-slate-500">
        Jawab soal yang tampil. Sistem memilih soal berikutnya menggunakan WRS.
      </p>
    </div>

    {#if session}
      <div
        class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-right shadow-sm"
      >
        <p class="text-xs font-bold uppercase tracking-wide text-slate-400">
          Progress
        </p>

        <p class="mt-1 text-lg font-bold text-slate-950">
          {session.answeredCount + 1} / {session.totalQuestions}
        </p>
      </div>
    {/if}
  </div>

  {#if errorMessage}
    <p
      class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </p>
  {/if}

  {#if loading}
    <div
      class="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm"
    >
      Memuat soal...
    </div>
  {:else if question && session}
    <div class="grid gap-5 xl:grid-cols-[1fr_280px]">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-5 flex items-center gap-3">
          <span
            class="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900"
          >
            Level saat ini: {getDifficultyLabel(session.currentLevel)}
          </span>

          <span
            class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
          >
            Soal {session.answeredCount + 1}
          </span>
        </div>

        <h3 class="text-lg font-bold leading-8 text-slate-950">
          {question.questionText}
        </h3>

        <div class="mt-6 space-y-3">
          <button
            type="button"
            onclick={() => (selectedAnswer = "A")}
            class={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold ${optionClass("A")}`}
          >
            A. {question.optionA}
          </button>

          <button
            type="button"
            onclick={() => (selectedAnswer = "B")}
            class={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold ${optionClass("B")}`}
          >
            B. {question.optionB}
          </button>

          <button
            type="button"
            onclick={() => (selectedAnswer = "C")}
            class={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold ${optionClass("C")}`}
          >
            C. {question.optionC}
          </button>

          <button
            type="button"
            onclick={() => (selectedAnswer = "D")}
            class={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold ${optionClass("D")}`}
          >
            D. {question.optionD}
          </button>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            onclick={submitAnswer}
            disabled={submitting}
            class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {submitting ? "Mengirim..." : "Kirim Jawaban"}
          </button>
        </div>
      </div>

      <aside class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-bold text-slate-950">Status Sesi</p>

        <div class="mt-4 space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-500">Level awal</span>
            <span class="font-bold text-slate-900">
              {getDifficultyLabel(session.initialLevel)}
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-slate-500">Level saat ini</span>
            <span class="font-bold text-slate-900">
              {getDifficultyLabel(session.currentLevel)}
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-slate-500">Benar</span>
            <span class="font-bold text-emerald-700"
              >{session.correctCount}</span
            >
          </div>

          <div class="flex justify-between">
            <span class="text-slate-500">Salah</span>
            <span class="font-bold text-red-700">{session.wrongCount}</span>
          </div>
        </div>
      </aside>
    </div>
  {/if}
</section>
