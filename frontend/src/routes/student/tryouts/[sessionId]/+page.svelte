<script lang="ts">
  import { beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import {
    invalidateStudentSessionsCache,
    invalidateStudentTryoutsCache,
  } from "$lib/cache/student-page-cache";

  import type { AnswerOption } from "$lib/types/questions";

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

  let allowNavigation = false;

  const currentQuestionNumber = $derived(
    session ? Math.min(session.answeredCount + 1, session.totalQuestions) : 0,
  );

  const progressPercentage = $derived(
    session && session.totalQuestions > 0
      ? Math.min(
          100,
          Math.round((currentQuestionNumber / session.totalQuestions) * 100),
        )
      : 0,
  );

  const timerState = $derived.by(() => {
    if (remainingSeconds <= 60) {
      return "DANGER";
    }

    if (remainingSeconds <= 300) {
      return "WARNING";
    }

    return "NORMAL";
  });

  function formatTime(totalSeconds: number) {
    const safeSeconds = Math.max(0, totalSeconds);

    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}`;
  }

  function getTimerClass() {
    if (timerState === "DANGER") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    if (timerState === "WARNING") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border-slate-200 bg-white text-slate-950";
  }

  function optionClass(answer: AnswerOption) {
    if (selectedAnswer === answer) {
      return "border-[#174aa6] bg-blue-50 text-[#062b63] ring-2 ring-[#174aa6]/10";
    }

    return "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50";
  }

  function clearTimer() {
    if (!timerInterval) {
      return;
    }

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

  function invalidateSessionData() {
    invalidateStudentSessionsCache();
    invalidateStudentTryoutsCache();
  }

  async function goToResult() {
    allowNavigation = true;

    clearTimer();
    invalidateSessionData();

    await goto(`/student/results/${sessionId}`, {
      replaceState: true,
    });
  }

  async function finishByTimeout() {
    if (finishingTimeout || !sessionId) {
      return;
    }

    finishingTimeout = true;
    errorMessage = "";

    try {
      await apiFetch<TimeoutSessionResponse>(
        `/student/sessions/${sessionId}/timeout`,
        {
          method: "POST",
        },
      );

      await goToResult();
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
        await goToResult();

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
    if (!question || !sessionId) {
      return;
    }

    if (remainingSeconds <= 0) {
      await finishByTimeout();

      return;
    }

    if (!selectedAnswer) {
      errorMessage = "Pilih salah satu jawaban terlebih dahulu.";

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
        await goToResult();

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

  beforeNavigate((navigation) => {
    if (allowNavigation) {
      return;
    }

    const destinationPath = navigation.to?.url.pathname;

    if (!destinationPath) {
      return;
    }

    if (destinationPath === page.url.pathname) {
      return;
    }

    navigation.cancel();
  });

  onMount(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (allowNavigation) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    void loadNextQuestion();

    return () => {
      clearTimer();

      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  });
</script>

{#snippet answerOption(answer: AnswerOption, text: string)}
  <button
    type="button"
    aria-pressed={selectedAnswer === answer}
    disabled={submitting || finishingTimeout}
    onclick={() => (selectedAnswer = answer)}
    class={`group flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left text-sm font-semibold leading-6 transition disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 ${optionClass(
      answer,
    )}`}
  >
    <span
      class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black transition ${
        selectedAnswer === answer
          ? "bg-[#174aa6] text-white"
          : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-[#0c438c]"
      }`}
    >
      {answer}
    </span>

    <span class="min-w-0 pt-1">
      {text}
    </span>
  </button>
{/snippet}

<section class="mx-auto max-w-6xl space-y-5">
  <div
    class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
  >
    <div class="min-w-0">
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700"
        >
          <span class="h-2 w-2 animate-pulse rounded-full bg-amber-500"></span>

          Ujian berlangsung
        </span>
      </div>

      <h2
        class="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
      >
        Kerjakan Tryout
      </h2>

      <p class="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
        Pilih jawaban terbaik untuk setiap soal. Jangan meninggalkan halaman
        selama ujian berlangsung.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
      <div
        class={`min-w-28 rounded-2xl border px-4 py-3 text-center shadow-sm sm:min-w-32 ${getTimerClass()}`}
      >
        <p
          class="text-[10px] font-black uppercase tracking-[0.14em] opacity-60"
        >
          Sisa waktu
        </p>

        <p class="mt-1 font-mono text-xl font-black tabular-nums sm:text-2xl">
          {formatTime(remainingSeconds)}
        </p>
      </div>

      <div
        class="min-w-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm sm:min-w-32"
      >
        <p
          class="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400"
        >
          Progress
        </p>

        <p class="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
          {currentQuestionNumber}

          <span class="text-base text-slate-400">
            /
            {session?.totalQuestions ?? 0}
          </span>
        </p>
      </div>
    </div>
  </div>

  {#if session}
    <div
      class="overflow-hidden rounded-full bg-slate-200"
      aria-label={`Progress ${progressPercentage}%`}
    >
      <div
        class="h-2 rounded-full bg-[#174aa6] transition-[width] duration-300"
        style={`width: ${progressPercentage}%`}
      ></div>
    </div>
  {/if}

  <div
    class="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3"
  >
    <div
      class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#0c438c]"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </svg>
    </div>

    <div>
      <p class="text-sm font-bold text-[#062b63]">Mode ujian aktif</p>

      <p class="mt-0.5 text-xs leading-5 text-slate-600">
        Navigasi ke halaman lain dinonaktifkan. Timer tetap berjalan selama sesi
        berlangsung.
      </p>
    </div>
  </div>

  {#if errorMessage}
    <div
      class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </div>
  {/if}

  {#if loading}
    <div
      class="rounded-2xl border border-slate-200 bg-white px-6 py-12 shadow-sm"
    >
      <div class="flex items-center justify-center gap-3">
        <div
          class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0c438c]"
        ></div>

        <p class="text-sm font-semibold text-slate-500">Memuat soal...</p>
      </div>
    </div>
  {:else if question && session}
    <article
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div class="h-1.5 bg-[#f8c900]"></div>

      <div class="p-4 sm:p-6 lg:p-8">
        <div
          class="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p
              class="text-[10px] font-black uppercase tracking-[0.16em] text-[#0c438c]"
            >
              Soal
            </p>

            <p class="mt-1 text-sm font-bold text-slate-500">
              Nomor

              <span class="text-slate-950">
                {currentQuestionNumber}
              </span>

              dari

              <span class="text-slate-950">
                {session.totalQuestions}
              </span>
            </p>
          </div>

          <span
            class="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500"
          >
            Pilih satu jawaban
          </span>
        </div>

        <div class="py-6">
          <h3
            class="whitespace-pre-line text-lg font-black leading-8 text-slate-950 sm:text-xl sm:leading-9"
          >
            {question.questionText}
          </h3>

          {#if question.imageUrl}
            <figure
              class="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
            >
              <div
                class="flex min-h-48 items-center justify-center p-3 sm:min-h-64 sm:p-5"
              >
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

          <div class="mt-6 grid gap-3">
            {@render answerOption("A", question.optionA)}
            {@render answerOption("B", question.optionB)}
            {@render answerOption("C", question.optionC)}
            {@render answerOption("D", question.optionD)}
          </div>
        </div>

        <div
          class="sticky bottom-0 -mx-4 -mb-4 border-t border-slate-100 bg-white/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:mb-0 sm:flex sm:items-center sm:justify-between sm:bg-white sm:px-0 sm:pb-0 sm:pt-5"
        >
          <p class="hidden text-xs leading-5 text-slate-400 sm:block">
            Jawaban yang sudah dikirim tidak dapat diubah.
          </p>

          <button
            type="button"
            onclick={submitAnswer}
            disabled={submitting || finishingTimeout || !selectedAnswer}
            class="relative w-full overflow-hidden rounded-xl bg-[#17409c] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0c438c] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            <span class="relative z-10">
              {submitting
                ? "Mengirim jawaban..."
                : finishingTimeout
                  ? "Menyelesaikan..."
                  : selectedAnswer
                    ? `Kirim Jawaban ${selectedAnswer}`
                    : "Pilih Jawaban"}
            </span>

            <span class="absolute bottom-0 left-0 h-1 w-full bg-[#f8c900]"
            ></span>
          </button>
        </div>
      </div>
    </article>
  {:else}
    <div
      class="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm"
    >
      <p class="font-bold text-slate-700">Soal tidak tersedia.</p>

      <p class="mt-1 text-sm text-slate-400">
        Sistem tidak mendapatkan soal berikutnya dari sesi ini.
      </p>
    </div>
  {/if}
</section>
