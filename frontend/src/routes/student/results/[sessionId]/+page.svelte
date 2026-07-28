<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import type { StudentResultResponse } from "$lib/types/student";

  import { getDifficultyLabel } from "$lib/types/questions";

  type AnswerOption = "A" | "B" | "C" | "D";

  type ResultAnswer = StudentResultResponse["answers"][number];

  const sessionId = $derived(page.params.sessionId ?? "");

  let loading = $state(true);
  let errorMessage = $state("");
  let result = $state<StudentResultResponse | null>(null);

  function getAnswerText(answer: ResultAnswer, option: AnswerOption) {
    const optionMap: Record<AnswerOption, string> = {
      A: answer.optionA,
      B: answer.optionB,
      C: answer.optionC,
      D: answer.optionD,
    };

    return optionMap[option];
  }

  function getAnswerDisplay(
    answer: ResultAnswer,
    option: AnswerOption | null | undefined,
  ) {
    if (!option) {
      return "Tidak dijawab";
    }

    const answerText = getAnswerText(answer, option);

    if (!answerText) {
      return option;
    }

    return `${option}. ${answerText}`;
  }

  function getDifficultyBadgeClass(
    difficultyLevel: ResultAnswer["difficultyLevel"],
  ) {
    if (difficultyLevel === "LOW") {
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    }

    if (difficultyLevel === "MEDIUM") {
      return "bg-amber-50 text-amber-700 ring-amber-200";
    }

    if (difficultyLevel === "HIGH") {
      return "bg-red-50 text-red-700 ring-red-200";
    }

    return "bg-slate-50 text-slate-600 ring-slate-200";
  }

  async function loadResult() {
    if (!sessionId) {
      errorMessage = "Session ID tidak ditemukan.";

      loading = false;

      return;
    }

    loading = true;
    errorMessage = "";

    try {
      result = await apiFetch<StudentResultResponse>(
        `/student/sessions/${sessionId}/result`,
      );
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat hasil tryout.";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void loadResult();
  });
</script>

<section class="space-y-6">
  <!-- Header -->
  <div>
    <h2 class="text-2xl font-bold text-slate-950">Hasil Tryout</h2>

    <p class="mt-1 text-sm text-slate-500">
      Ringkasan nilai akhir dan jawaban siswa.
    </p>
  </div>

  <!-- Error -->
  {#if errorMessage}
    <p
      class="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </p>
  {/if}

  <!-- Loading -->
  {#if loading}
    <div
      class="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm"
    >
      Memuat hasil...
    </div>
  {:else if result}
    <!-- Summary -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <!-- Score -->
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Nilai Akhir</p>

        <p class="mt-2 text-3xl font-bold text-blue-900">
          {result.session.score}
        </p>
      </div>

      <!-- Correct -->
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Benar</p>

        <p class="mt-2 text-3xl font-bold text-emerald-700">
          {result.session.correctCount}
        </p>
      </div>

      <!-- Wrong -->
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Salah</p>

        <p class="mt-2 text-3xl font-bold text-red-700">
          {result.session.wrongCount}
        </p>
      </div>

      <!-- Initial Difficulty -->
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Level Awal</p>

        <p class="mt-2 text-2xl font-bold text-slate-950">
          {getDifficultyLabel(result.session.initialLevel)}
        </p>
      </div>
    </div>

    <!-- Tryout Information -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 class="text-lg font-bold text-slate-950">
        {result.session.tryoutTitle}
      </h3>

      <div class="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
        <p>
          Bank soal:
          <span class="font-semibold text-slate-700">
            {result.session.bankName}
          </span>
        </p>

        <p>
          Total soal:
          <span class="font-semibold text-slate-700">
            {result.session.totalQuestions}
          </span>
        </p>
      </div>

      <div class="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onclick={() => goto("/student/tryouts")}
          class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-950"
        >
          Coba Tryout Lain
        </button>

        <button
          type="button"
          onclick={() => goto("/student/history")}
          class="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Lihat Riwayat
        </button>
      </div>
    </div>

    <!-- Answer Review Heading -->
    <div class="flex items-end justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-slate-950">Pembahasan Jawaban</h3>

        <p class="mt-1 text-sm text-slate-500">
          Lihat jawaban yang kamu pilih, tingkat kesulitan, dan kunci jawaban
          setiap soal.
        </p>
      </div>
    </div>

    <!-- Answer List -->
    <div class="space-y-4">
      {#each result.answers as answer, index}
        <article
          class={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
            answer.isCorrect ? "border-emerald-200" : "border-red-200"
          }`}
        >
          <!-- Question Header -->
          <div
            class="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 p-5 sm:px-6"
          >
            <div class="min-w-0 flex-1">
              <!-- Question Meta -->
              <div class="flex flex-wrap items-center gap-2">
                <p
                  class="text-xs font-bold uppercase tracking-wide text-slate-400"
                >
                  Soal {index + 1}
                </p>

                <!-- Difficulty Badge -->
                {#if answer.difficultyLevel}
                  <span
                    class={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${getDifficultyBadgeClass(
                      answer.difficultyLevel,
                    )}`}
                  >
                    {getDifficultyLabel(answer.difficultyLevel)}
                  </span>
                {/if}
              </div>

              <!-- Question Text -->
              <p
                class="mt-2 whitespace-pre-line font-semibold leading-7 text-slate-900"
              >
                {answer.questionText}
              </p>
            </div>

            <!-- Result Status -->
            {#if answer.isCorrect}
              <span
                class="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
              >
                Benar
              </span>
            {:else}
              <span
                class="shrink-0 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700"
              >
                Salah
              </span>
            {/if}
          </div>

          <!-- Question Image -->
          {#if answer.imageUrl}
            <figure
              class="mx-5 mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:mx-6"
            >
              <div class="flex min-h-40 items-center justify-center p-3 sm:p-5">
                <img
                  src={answer.imageUrl}
                  alt={answer.imageAltText ?? "Gambar pendukung soal"}
                  loading="lazy"
                  decoding="async"
                  class="max-h-[460px] w-auto max-w-full rounded-xl object-contain"
                />
              </div>

              {#if answer.imageAltText}
                <figcaption
                  class="border-t border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500"
                >
                  {answer.imageAltText}
                </figcaption>
              {/if}
            </figure>
          {/if}

          <!-- Answer Comparison -->
          <div class="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <!-- Student Answer -->
            <div
              class={`rounded-2xl border p-4 ${
                answer.isCorrect
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-red-200 bg-red-50/60"
              }`}
            >
              <div class="flex items-center gap-2">
                <span
                  class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                    answer.isCorrect
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {answer.selectedAnswer ?? "-"}
                </span>

                <p
                  class="text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Jawaban Siswa
                </p>
              </div>

              <p
                class={`mt-3 text-sm font-bold leading-6 ${
                  answer.isCorrect ? "text-emerald-800" : "text-red-800"
                }`}
              >
                {getAnswerDisplay(answer, answer.selectedAnswer)}
              </p>
            </div>

            <!-- Correct Answer -->
            <div
              class="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4"
            >
              <div class="flex items-center gap-2">
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-black text-emerald-700"
                >
                  {answer.correctAnswer}
                </span>

                <p
                  class="text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  Kunci Jawaban
                </p>
              </div>

              <p class="mt-3 text-sm font-bold leading-6 text-emerald-800">
                {getAnswerDisplay(answer, answer.correctAnswer)}
              </p>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
