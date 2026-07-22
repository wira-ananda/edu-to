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

  function getSessionStatusLabel(status: "ONGOING" | "FINISHED") {
    if (status === "FINISHED") return "Selesai";

    return "Berlangsung";
  }

  async function loadHistory(options: { force?: boolean } = {}) {
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
        error instanceof Error ? error.message : "Gagal memuat riwayat tryout.";
    } finally {
      loading = false;
    }
  }

  async function refreshHistory() {
    refreshing = true;
    invalidateStudentSessionsCache();

    try {
      await loadHistory({ force: true });
    } finally {
      refreshing = false;
    }
  }

  onMount(() => {
    void loadHistory();
  });
</script>

<section class="space-y-5">
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <h2 class="text-2xl font-bold text-slate-950">Riwayat Tryout</h2>

      <p class="mt-1 text-sm text-slate-500">
        Daftar sesi tryout yang pernah kamu kerjakan.
      </p>
    </div>

    <button
      type="button"
      onclick={refreshHistory}
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
      Memuat riwayat...
    </div>
  {:else if sessions.length === 0}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-600">
        Belum ada riwayat tryout.
      </p>

      <button
        type="button"
        onclick={() => goto("/student/tryouts")}
        class="mt-4 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white"
      >
        Mulai Tryout
      </button>
    </div>
  {:else}
    <div
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-[980px] text-left text-sm">
          <thead
            class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"
          >
            <tr>
              <th class="px-5 py-4">Tryout</th>
              <th class="px-5 py-4">Percobaan</th>
              <th class="px-5 py-4">Status</th>
              <th class="px-5 py-4">Progress</th>
              <th class="px-5 py-4">Level Awal</th>
              <th class="px-5 py-4">Level Akhir</th>
              <th class="px-5 py-4">Nilai</th>
              <th class="px-5 py-4">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {#each sessions as session}
              <tr class="border-t border-slate-100">
                <td class="px-5 py-4">
                  <p class="font-bold text-slate-900">
                    {session.tryout.title}
                  </p>

                  <p class="text-xs text-slate-400">
                    Bank soal: {session.tryout.subject.name}
                  </p>

                  <p class="text-xs text-slate-400">
                    {new Date(session.startedAt).toLocaleString("id-ID")}
                  </p>
                </td>

                <td class="px-5 py-4 font-bold text-slate-900">
                  #{session.attemptNumber}
                </td>

                <td class="px-5 py-4">
                  {#if session.status === "FINISHED"}
                    <span
                      class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                    >
                      {getSessionStatusLabel(session.status)}
                    </span>
                  {:else}
                    <span
                      class="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"
                    >
                      {getSessionStatusLabel(session.status)}
                    </span>
                  {/if}
                </td>

                <td class="px-5 py-4 font-semibold text-slate-700">
                  {session._count?.answers ?? 0}
                  <span class="text-slate-400">/</span>
                  {session.totalQuestions}
                </td>

                <td class="px-5 py-4 font-semibold text-slate-700">
                  {getDifficultyLabel(session.initialLevel)}
                </td>

                <td class="px-5 py-4 font-semibold text-slate-700">
                  {getDifficultyLabel(session.currentLevel)}
                </td>

                <td class="px-5 py-4 font-bold text-slate-900">
                  {session.score}
                </td>

                <td class="px-5 py-4">
                  {#if session.status === "FINISHED"}
                    <button
                      type="button"
                      onclick={() => goto(`/student/results/${session.id}`)}
                      class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700"
                    >
                      Lihat Hasil
                    </button>
                  {:else}
                    <button
                      type="button"
                      onclick={() => goto(`/student/tryouts/${session.id}`)}
                      class="rounded-lg bg-blue-900 px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      Lanjutkan
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</section>
