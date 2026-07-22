<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type {
    TeacherTryoutResultsResponse,
    TeacherTryoutsResponse,
    TeacherTryoutStatisticsResponse,
  } from "$lib/types/teacher";

  let loading = $state(true);
  let loadingResults = $state(false);
  let errorMessage = $state("");

  let tryouts = $state<TeacherTryoutsResponse["tryouts"]>([]);
  let selectedTryoutId = $state("");
  let sessions = $state<TeacherTryoutResultsResponse["sessions"]>([]);
  let statistics = $state<TeacherTryoutStatisticsResponse | null>(null);

  const selectedTryout = $derived(
    tryouts.find((tryout) => tryout.id === selectedTryoutId) ?? null,
  );

  async function loadTryouts() {
    const result = await apiFetch<TeacherTryoutsResponse>("/teacher/tryouts");

    tryouts = result.tryouts;

    const queryTryoutId = page.url.searchParams.get("tryoutId");
    const foundFromQuery = tryouts.find(
      (tryout) => tryout.id === queryTryoutId,
    );

    selectedTryoutId = foundFromQuery?.id ?? tryouts[0]?.id ?? "";
  }

  async function loadResults() {
    if (!selectedTryoutId) {
      sessions = [];
      statistics = null;
      return;
    }

    loadingResults = true;
    errorMessage = "";

    try {
      const [resultsResult, statisticsResult] = await Promise.all([
        apiFetch<TeacherTryoutResultsResponse>(
          `/teacher/tryouts/${selectedTryoutId}/results`,
        ),
        apiFetch<TeacherTryoutStatisticsResponse>(
          `/teacher/tryouts/${selectedTryoutId}/statistics`,
        ),
      ]);

      sessions = resultsResult.sessions;
      statistics = statisticsResult;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat hasil siswa.";
    } finally {
      loadingResults = false;
    }
  }

  async function handleTryoutChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;

    selectedTryoutId = select.value;

    await loadResults();
  }

  onMount(async () => {
    loading = true;
    errorMessage = "";

    try {
      await loadTryouts();
      await loadResults();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat data tryout.";
    } finally {
      loading = false;
    }
  });
</script>

<section class="space-y-5">
  <div>
    <h2 class="text-2xl font-bold text-slate-950">Hasil Siswa</h2>

    <p class="mt-1 text-sm text-slate-500">
      Lihat hasil pengerjaan siswa pada tryout milikmu.
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
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-500">Memuat hasil siswa...</p>
    </div>
  {:else if tryouts.length === 0}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-700">Belum ada tryout.</p>

      <p class="mt-2 text-sm text-slate-500">
        Buat tryout terlebih dahulu untuk melihat hasil siswa.
      </p>
    </div>
  {:else}
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <label for="tryoutId" class="text-sm font-bold text-slate-700">
        Pilih Tryout
      </label>

      <select
        id="tryoutId"
        value={selectedTryoutId}
        onchange={handleTryoutChange}
        disabled={loadingResults}
        class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
      >
        {#each tryouts as tryout}
          <option value={tryout.id}>
            {tryout.title} - {tryout.bank.name}
          </option>
        {/each}
      </select>

      {#if selectedTryout}
        <p class="mt-2 text-xs text-slate-500">
          {selectedTryout.totalQuestions} soal · {selectedTryout.durationMinutes}
          menit · {selectedTryout.totalSessions} sesi siswa
        </p>
      {/if}
    </div>

    {#if loadingResults}
      <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Memuat hasil...</p>
      </div>
    {:else}
      {#if statistics}
        <div class="grid gap-4 md:grid-cols-4">
          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-semibold text-slate-500">Total Siswa</p>

            <p class="mt-2 text-3xl font-bold text-slate-950">
              {statistics.summary.totalStudents}
            </p>
          </div>

          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-semibold text-slate-500">Sesi Selesai</p>

            <p class="mt-2 text-3xl font-bold text-emerald-700">
              {statistics.summary.finishedSessions}
            </p>
          </div>

          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-semibold text-slate-500">Rata-rata Nilai</p>

            <p class="mt-2 text-3xl font-bold text-blue-900">
              {statistics.summary.averageScore}
            </p>
          </div>

          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-semibold text-slate-500">Completion Rate</p>

            <p class="mt-2 text-3xl font-bold text-slate-950">
              {statistics.summary.completionRate}%
            </p>
          </div>
        </div>
      {/if}

      <div
        class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1100px] text-left text-sm">
            <thead
              class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"
            >
              <tr>
                <th class="px-5 py-4">Siswa</th>
                <th class="px-5 py-4">Percobaan</th>
                <th class="px-5 py-4">Status</th>
                <th class="px-5 py-4">Nilai</th>
                <th class="px-5 py-4">Benar</th>
                <th class="px-5 py-4">Salah</th>
                <th class="px-5 py-4">Progress</th>
                <th class="px-5 py-4">Waktu</th>
              </tr>
            </thead>

            <tbody>
              {#if sessions.length === 0}
                <tr>
                  <td colspan="8" class="px-5 py-10 text-center text-slate-500">
                    Belum ada siswa yang mengerjakan tryout ini.
                  </td>
                </tr>
              {:else}
                {#each sessions as session}
                  <tr class="border-t border-slate-100">
                    <td class="px-5 py-4">
                      <p class="font-bold text-slate-900">
                        {session.student.name}
                      </p>

                      <p class="text-xs text-slate-400">
                        {session.student.email}
                      </p>

                      <p class="text-xs text-slate-400">
                        {session.student.school ?? "-"} · {session.student
                          .className ?? "-"}
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
                          Selesai
                        </span>
                      {:else}
                        <span
                          class="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"
                        >
                          Berlangsung
                        </span>
                      {/if}
                    </td>

                    <td class="px-5 py-4 font-bold text-blue-900">
                      {session.score}
                    </td>

                    <td class="px-5 py-4 font-bold text-emerald-700">
                      {session.correctCount}
                    </td>

                    <td class="px-5 py-4 font-bold text-red-700">
                      {session.wrongCount}
                    </td>

                    <td class="px-5 py-4 font-semibold text-slate-700">
                      {session.answeredCount}
                      <span class="text-slate-400">/</span>
                      {session.totalQuestions}
                    </td>

                    <td class="px-5 py-4">
                      <p class="text-xs text-slate-500">
                        Mulai:
                        {new Date(session.startedAt).toLocaleString("id-ID")}
                      </p>

                      <p class="text-xs text-slate-500">
                        Selesai:
                        {session.finishedAt
                          ? new Date(session.finishedAt).toLocaleString("id-ID")
                          : "-"}
                      </p>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  {/if}
</section>
