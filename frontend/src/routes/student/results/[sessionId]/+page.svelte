<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type { StudentResultResponse } from "$lib/types/student";
  import { getDifficultyLabel } from "$lib/types/questions";

  const sessionId = $derived(page.params.sessionId ?? "");

  let loading = $state(true);
  let errorMessage = $state("");
  let result = $state<StudentResultResponse | null>(null);

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

<section class="space-y-5">
  <div>
    <h2 class="text-2xl font-bold text-slate-950">Hasil Tryout</h2>

    <p class="mt-1 text-sm text-slate-500">
      Ringkasan nilai akhir dan jawaban siswa.
    </p>
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
      Memuat hasil...
    </div>
  {:else if result}
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Nilai Akhir</p>

        <p class="mt-2 text-3xl font-bold text-blue-900">
          {result.session.score}
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Benar</p>

        <p class="mt-2 text-3xl font-bold text-emerald-700">
          {result.session.correctCount}
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Salah</p>

        <p class="mt-2 text-3xl font-bold text-red-700">
          {result.session.wrongCount}
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Level Awal</p>

        <p class="mt-2 text-2xl font-bold text-slate-950">
          {getDifficultyLabel(result.session.initialLevel)}
        </p>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 class="text-lg font-bold text-slate-950">
        {result.session.tryoutTitle}
      </h3>

      <p class="mt-1 text-sm text-slate-500">
        Bank soal: {result.session.bankName}
      </p>

      <p class="mt-1 text-sm text-slate-500">
        Total soal:
        {result.session.totalQuestions}
      </p>

      <div class="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onclick={() => goto("/student/tryouts")}
          class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white"
        >
          Coba Tryout Lain
        </button>

        <button
          type="button"
          onclick={() => goto("/student/history")}
          class="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700"
        >
          Lihat Riwayat
        </button>
      </div>
    </div>

    <div class="space-y-4">
      {#each result.answers as answer, index}
        <article
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                class="text-xs font-bold uppercase tracking-wide text-slate-400"
              >
                Soal {index + 1}
              </p>

              <p
                class="mt-2 whitespace-pre-line font-semibold leading-7 text-slate-900"
              >
                {answer.questionText}
              </p>
            </div>

            {#if answer.isCorrect}
              <span
                class="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
              >
                Benar
              </span>
            {:else}
              <span
                class="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700"
              >
                Salah
              </span>
            {/if}
          </div>

          {#if answer.imageUrl}
            <figure
              class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
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

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl bg-slate-50 p-4">
              <p
                class="text-xs font-bold uppercase tracking-wide text-slate-400"
              >
                Jawaban Siswa
              </p>

              <p
                class={`mt-1 font-bold ${
                  answer.isCorrect ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {answer.selectedAnswer ?? "Tidak dijawab"}
              </p>
            </div>

            <div class="rounded-xl bg-slate-50 p-4">
              <p
                class="text-xs font-bold uppercase tracking-wide text-slate-400"
              >
                Kunci Jawaban
              </p>

              <p class="mt-1 font-bold text-slate-900">
                {answer.correctAnswer}
              </p>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
