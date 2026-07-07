<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type { StudentResultResponse } from "$lib/types/student";
  import { getDifficultyLabel } from "$lib/types/questions";

  const sessionId = $derived(page.params.sessionId);

  let loading = $state(true);
  let errorMessage = $state("");
  let result = $state<StudentResultResponse | null>(null);

  async function loadResult() {
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

  onMount(loadResult);
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
    <div class="grid gap-4 md:grid-cols-4">
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
        Total soal: {result.session.totalQuestions}
      </p>

      <div class="mt-5 flex gap-3">
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

    <div
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <table class="w-full text-left text-sm">
        <thead
          class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"
        >
          <tr>
            <th class="px-5 py-4">No</th>
            <th class="px-5 py-4">Soal</th>
            <th class="px-5 py-4">Jawaban</th>
            <th class="px-5 py-4">Kunci</th>
            <th class="px-5 py-4">Status</th>
          </tr>
        </thead>

        <tbody>
          {#each result.answers as answer, index}
            <tr class="border-t border-slate-100">
              <td class="px-5 py-4 text-slate-500">
                {index + 1}
              </td>

              <td class="max-w-xl px-5 py-4 font-semibold text-slate-800">
                {answer.questionText}
              </td>

              <td class="px-5 py-4 font-bold text-slate-800">
                {answer.selectedAnswer}
              </td>

              <td class="px-5 py-4 font-bold text-slate-800">
                {answer.correctAnswer}
              </td>

              <td class="px-5 py-4">
                {#if answer.isCorrect}
                  <span
                    class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                  >
                    Benar
                  </span>
                {:else}
                  <span
                    class="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700"
                  >
                    Salah
                  </span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
