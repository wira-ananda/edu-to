<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onDestroy, onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type { AnswerOption } from "$lib/types/questions";
  import { getDifficultyLabel } from "$lib/types/questions";
  import type {
    NextQuestionResponse,
    StudentQuestion,
    SubmitAnswerResponse,
    TimeoutSessionResponse,
  } from "$lib/types/student";

  const sessionId = $derived(page.params.sessionId ?? "");

  let loading = $state(true);
  let submitting = $state(false);
  let finishingTimeout = $state(false);
  let errorMessage = $state("");

  let question = $state<StudentQuestion | null>(null);
  let selectedAnswer = $state<AnswerOption | "">("");
  let session = $state<NextQuestionResponse["session"] | null>(null);

  let remainingSeconds = $state(0);

  let timerInterval: ReturnType<typeof setInterval> | null = null;

  let serverOffsetMs = 0;

  function formatTime(totalSeconds: number) {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}`;
  }

  function clearTimer() {
    if (!timerInterval) return;

    clearInterval(timerInterval);
    timerInterval = null;
  }

  function startTimer(endsAt: string, serverNow: string) {
    clearTimer();

    serverOffsetMs = new Date(serverNow).getTime() - Date.now();

    function tick() {
      const now = Date.now() + serverOffsetMs;
      const end = new Date(endsAt).getTime();

      remainingSeconds = Math.max(0, Math.ceil((end - now) / 1000));

      if (remainingSeconds <= 0) {
        clearTimer();
        void finishByTimeout();
      }
    }

    tick();

    timerInterval = setInterval(tick, 1000);
  }

  async function finishByTimeout() {
    if (finishingTimeout || !sessionId) return;

    finishingTimeout = true;
    errorMessage = "";

    try {
      await apiFetch<TimeoutSessionResponse>(
        `/student/sessions/${sessionId}/timeout`,
        {
          method: "POST",
        },
      );

      await goto(`/student/results/${sessionId}`);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menyelesaikan tryout.";
    } finally {
      finishingTimeout = false;
    }
  }

  async function loadNextQuestion() {
    if (!sessionId) {
      errorMessage = "Session ID tidak ditemukan.";
      loading = false;
      return;
    }

    loading = true;
    errorMessage = "";
    selectedAnswer = "";

    try {
      const result = await apiFetch<NextQuestionResponse>(
        `/student/sessions/${sessionId}/next-question`,
      );

      if (result.finished) {
        clearTimer();
        await goto(`/student/results/${sessionId}`);
        return;
      }

      question = result.question ?? null;
      session = result.session ?? null;

      if (!question || !session) {
        throw new Error("Data soal atau sesi tidak lengkap.");
      }

      startTimer(session.endsAt, session.serverNow);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat soal.";
    } finally {
      loading = false;
    }
  }

  async function submitAnswer() {
    if (!question || !sessionId) return;

    if (remainingSeconds <= 0) {
      await finishByTimeout();
      return;
    }

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
        clearTimer();
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
      ? "border-blue-900 bg-blue-50 text-blue-950 ring-2 ring-blue-900/10"
      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50";
  }

  onMount(() => {
    void loadNextQuestion();
  });

  onDestroy(() => {
    clearTimer();
  });
</script>

<section class="space-y-5">
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <h2 class="text-2xl font-bold text-slate-950">Tryout Berlangsung</h2>

      <p class="mt-1 text-sm text-slate-500">
        Jawab soal yang tampil. Sistem memilih soal berikutnya menggunakan WRS.
      </p>
    </div>

    <div class="flex gap-3">
      <div
        class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-right shadow-sm"
      >
        <p class="text-xs font-bold uppercase tracking-wide text-slate-400">
          Timer
        </p>

        <p
          class={`mt-1 text-lg font-bold ${
            remainingSeconds <= 60 ? "text-red-700" : "text-slate-950"
          }`}
        >
          {formatTime(remainingSeconds)}
        </p>
      </div>

      {#if session}
        <div
          class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-right shadow-sm"
        >
          <p class="text-xs font-bold uppercase tracking-wide text-slate-400">
            Progress
          </p>

          <p class="mt-1 whitespace-nowrap text-lg font-bold text-slate-950">
            {Math.min(session.answeredCount + 1, session.totalQuestions)}
            /
            {session.totalQuestions}
          </p>
        </div>
      {/if}
    </div>
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
      <div
        class="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div class="mb-5 flex flex-wrap items-center gap-3">
          <span
            class="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900"
          >
            Level saat ini:
            {getDifficultyLabel(session.currentLevel)}
          </span>

          <span
            class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
          >
            Soal
            {Math.min(session.answeredCount + 1, session.totalQuestions)}
          </span>
        </div>

        <h3
          class="whitespace-pre-line text-lg font-bold leading-8 text-slate-950"
        >
          {question.questionText}
        </h3>

        {#if question.imageUrl}
          <figure
            class="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
          >
            <div class="flex min-h-48 items-center justify-center p-3 sm:p-5">
              <img
                src={question.imageUrl}
                alt={question.imageAltText ?? "Gambar pendukung soal"}
                loading="eager"
                decoding="async"
                class="max-h-[520px] w-auto max-w-full rounded-xl object-contain"
              />
            </div>

            {#if question.imageAltText}
              <figcaption
                class="border-t border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500"
              >
                {question.imageAltText}
              </figcaption>
            {/if}
          </figure>
        {/if}

        <div class="mt-6 space-y-3">
          <button
            type="button"
            onclick={() => (selectedAnswer = "A")}
            class={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${optionClass(
              "A",
            )}`}
          >
            <span class="mr-2 font-bold">A.</span>
            {question.optionA}
          </button>

          <button
            type="button"
            onclick={() => (selectedAnswer = "B")}
            class={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${optionClass(
              "B",
            )}`}
          >
            <span class="mr-2 font-bold">B.</span>
            {question.optionB}
          </button>

          <button
            type="button"
            onclick={() => (selectedAnswer = "C")}
            class={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${optionClass(
              "C",
            )}`}
          >
            <span class="mr-2 font-bold">C.</span>
            {question.optionC}
          </button>

          <button
            type="button"
            onclick={() => (selectedAnswer = "D")}
            class={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${optionClass(
              "D",
            )}`}
          >
            <span class="mr-2 font-bold">D.</span>
            {question.optionD}
          </button>
        </div>

        <div class="mt-6 flex justify-end border-t border-slate-100 pt-5">
          <button
            type="button"
            onclick={submitAnswer}
            disabled={submitting || finishingTimeout || !selectedAnswer}
            class="w-full rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {submitting
              ? "Mengirim..."
              : finishingTimeout
                ? "Menyelesaikan..."
                : "Kirim Jawaban"}
          </button>
        </div>
      </div>

      <aside
        class="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-24"
      >
        <p class="text-sm font-bold text-slate-950">Status Sesi</p>

        <div class="mt-4 space-y-3 text-sm">
          <div class="flex justify-between gap-4">
            <span class="text-slate-500"> Level awal </span>

            <span class="font-bold text-slate-900">
              {getDifficultyLabel(session.initialLevel)}
            </span>
          </div>

          <div class="flex justify-between gap-4">
            <span class="text-slate-500"> Level saat ini </span>

            <span class="font-bold text-slate-900">
              {getDifficultyLabel(session.currentLevel)}
            </span>
          </div>

          <div class="flex justify-between gap-4">
            <span class="text-slate-500"> Benar </span>

            <span class="font-bold text-emerald-700">
              {session.correctCount}
            </span>
          </div>

          <div class="flex justify-between gap-4">
            <span class="text-slate-500"> Salah </span>

            <span class="font-bold text-red-700">
              {session.wrongCount}
            </span>
          </div>
        </div>

        <p
          class="mt-5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-700"
        >
          Jika waktu habis, soal yang belum dijawab otomatis dihitung salah.
        </p>
      </aside>
    </div>
  {:else}
    <div
      class="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm"
    >
      Soal tidak tersedia.
    </div>
  {/if}
</section>
