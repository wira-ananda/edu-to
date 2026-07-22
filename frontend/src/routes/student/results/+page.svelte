<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import {
    getStudentSessionsCached,
    invalidateStudentSessionsCache,
    readStudentSessionsCache,
  } from "$lib/cache/student-page-cache";
  import type { StudentSessionsResponse } from "$lib/types/student";
  import { getDifficultyLabel } from "$lib/types/questions";

  let loading = $state(true);
  let refreshing = $state(false);
  let errorMessage = $state("");
  let sessions = $state<StudentSessionsResponse["sessions"]>([]);

  const finishedSessions = $derived(
    sessions.filter((session) => session.status === "FINISHED"),
  );

  const ongoingSessions = $derived(
    sessions.filter((session) => session.status === "ONGOING"),
  );

  const totalFinished = $derived(finishedSessions.length);

  const averageScore = $derived(
    totalFinished === 0
      ? 0
      : Math.round(
          finishedSessions.reduce(
            (total, session) => total + session.score,
            0,
          ) / totalFinished,
        ),
  );

  const highestScore = $derived(
    totalFinished === 0
      ? 0
      : Math.max(...finishedSessions.map((session) => session.score)),
  );

  const totalCorrect = $derived(
    finishedSessions.reduce(
      (total, session) => total + session.correctCount,
      0,
    ),
  );

  const totalWrong = $derived(
    finishedSessions.reduce((total, session) => total + session.wrongCount, 0),
  );

  async function loadResults(options: { force?: boolean } = {}) {
    const force = options.force ?? false;

    errorMessage = "";

    const cachedSessions = !force ? readStudentSessionsCache() : null;

    if (cachedSessions) {
      sessions = cachedSessions;
      loading = false;
      return;
    }

    loading = sessions.length === 0;

    try {
      sessions = await getStudentSessionsCached({ force });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat hasil belajar.";
    } finally {
      loading = false;
    }
  }

  async function refreshResults() {
    refreshing = true;
    invalidateStudentSessionsCache();

    try {
      await loadResults({ force: true });
    } finally {
      refreshing = false;
    }
  }

  onMount(() => {
    void loadResults();
  });
</script>

<section class="space-y-5">
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <h2 class="text-2xl font-bold text-slate-950">Hasil Belajar</h2>

      <p class="mt-1 text-sm text-slate-500">
        Ringkasan performa dari tryout yang sudah selesai.
      </p>
    </div>

    <button
      type="button"
      onclick={refreshResults}
      disabled={loading || refreshing}
      class="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-60"
    >
      {refreshing ? "Memuat..." : "Refresh"}
    </button>
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
      Memuat hasil belajar...
    </div>
  {:else}
    <div class="grid gap-4 md:grid-cols-5">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Tryout Selesai</p>

        <p class="mt-2 text-3xl font-bold text-slate-950">
          {totalFinished}
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Sedang Berjalan</p>

        <p class="mt-2 text-3xl font-bold text-amber-700">
          {ongoingSessions.length}
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Rata-rata Nilai</p>

        <p class="mt-2 text-3xl font-bold text-blue-900">
          {averageScore}
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Nilai Tertinggi</p>

        <p class="mt-2 text-3xl font-bold text-emerald-700">
          {highestScore}
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Benar / Salah</p>

        <p class="mt-2 text-3xl font-bold text-slate-950">
          {totalCorrect}
          <span class="text-lg text-slate-400">/</span>
          <span class="text-red-700">{totalWrong}</span>
        </p>
      </div>
    </div>

    {#if finishedSessions.length === 0}
      <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p class="text-sm font-semibold text-slate-700">
          Belum ada hasil belajar.
        </p>

        <p class="mt-2 text-sm text-slate-500">
          Hasil belajar akan muncul setelah kamu menyelesaikan tryout.
        </p>

        <button
          type="button"
          onclick={() => goto("/student/tryouts")}
          class="mt-5 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white"
        >
          Mulai Tryout
        </button>
      </div>
    {:else}
      <div
        class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1100px] text-left text-sm">
            <thead
              class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"
            >
              <tr>
                <th class="px-5 py-4">Tryout</th>
                <th class="px-5 py-4">Percobaan</th>
                <th class="px-5 py-4">Bank Soal</th>
                <th class="px-5 py-4">Nilai</th>
                <th class="px-5 py-4">Benar</th>
                <th class="px-5 py-4">Salah</th>
                <th class="px-5 py-4">Level Awal</th>
                <th class="px-5 py-4">Level Akhir</th>
                <th class="px-5 py-4">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {#each finishedSessions as session}
                <tr class="border-t border-slate-100">
                  <td class="px-5 py-4">
                    <p class="font-bold text-slate-900">
                      {session.tryout.title}
                    </p>

                    <p class="text-xs text-slate-400">
                      {new Date(session.startedAt).toLocaleString("id-ID")}
                    </p>
                  </td>

                  <td class="px-5 py-4 font-bold text-slate-900">
                    #{session.attemptNumber}
                  </td>

                  <td class="px-5 py-4 font-semibold text-slate-700">
                    {session.tryout.subject.name}
                  </td>

                  <td class="px-5 py-4">
                    <span
                      class="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-900"
                    >
                      {session.score}
                    </span>
                  </td>

                  <td class="px-5 py-4 font-bold text-emerald-700">
                    {session.correctCount}
                  </td>

                  <td class="px-5 py-4 font-bold text-red-700">
                    {session.wrongCount}
                  </td>

                  <td class="px-5 py-4 font-semibold text-slate-700">
                    {getDifficultyLabel(session.initialLevel)}
                  </td>

                  <td class="px-5 py-4 font-semibold text-slate-700">
                    {getDifficultyLabel(session.currentLevel)}
                  </td>

                  <td class="px-5 py-4">
                    <button
                      type="button"
                      onclick={() => goto(`/student/results/${session.id}`)}
                      class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700"
                    >
                      Lihat Detail
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  {/if}
</section>
