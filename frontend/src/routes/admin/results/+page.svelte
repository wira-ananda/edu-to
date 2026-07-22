<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type {
    AdminTryoutsResponse,
    TryoutResultsResponse,
    TryoutStatisticsResponse,
  } from "$lib/types/admin";
  import {
    getMaxAttemptsLabel,
    getTryoutStatusBadgeClass,
    getTryoutStatusLabel,
  } from "$lib/types/admin";

  let loading = $state(true);
  let loadingResults = $state(false);
  let errorMessage = $state("");

  let tryouts = $state<AdminTryoutsResponse["tryouts"]>([]);
  let selectedTryoutId = $state("");
  let sessions = $state<TryoutResultsResponse["sessions"]>([]);
  let statistics = $state<TryoutStatisticsResponse | null>(null);

  const selectedTryout = $derived(
    tryouts.find((tryout) => tryout.id === selectedTryoutId) ?? null,
  );

  function getTrendLabel(
    trend: "IMPROVING" | "DECLINING" | "STABLE" | "NO_DATA" | undefined,
  ) {
    if (trend === "IMPROVING") return "Meningkat";
    if (trend === "DECLINING") return "Menurun";
    if (trend === "STABLE") return "Stabil";

    return "Belum ada data";
  }

  function getTrendClass(
    trend: "IMPROVING" | "DECLINING" | "STABLE" | "NO_DATA" | undefined,
  ) {
    if (trend === "IMPROVING") return "bg-emerald-50 text-emerald-700";
    if (trend === "DECLINING") return "bg-red-50 text-red-700";
    if (trend === "STABLE") return "bg-blue-50 text-blue-900";

    return "bg-slate-100 text-slate-700";
  }

  function getOwnerLabel(tryout: AdminTryoutsResponse["tryouts"][number]) {
    if (!tryout.owner) {
      return "Tanpa owner";
    }

    if (tryout.owner.role === "ADMIN") {
      return `Admin: ${tryout.owner.name}`;
    }

    if (tryout.owner.role === "TEACHER") {
      return `Guru: ${tryout.owner.name}`;
    }

    return tryout.owner.name;
  }

  async function loadTryouts() {
    const result = await apiFetch<AdminTryoutsResponse>("/admin/tryouts");

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
        apiFetch<TryoutResultsResponse>(
          `/admin/tryouts/${selectedTryoutId}/results`,
        ),
        apiFetch<TryoutStatisticsResponse>(
          `/admin/tryouts/${selectedTryoutId}/statistics`,
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

  async function refreshResults() {
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
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <h2 class="text-2xl font-bold text-slate-950">Hasil Tryout</h2>

      <p class="mt-1 text-sm text-slate-500">
        Lihat hasil pengerjaan siswa dari tryout admin dan guru.
      </p>
    </div>

    <button
      type="button"
      onclick={refreshResults}
      disabled={loading || loadingResults || !selectedTryoutId}
      class="w-fit rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"
    >
      {loadingResults ? "Memuat..." : "Refresh"}
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
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-500">Memuat hasil tryout...</p>
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
        <div class="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          <span class="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            {getOwnerLabel(selectedTryout)}
          </span>

          <span class="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            {selectedTryout.totalQuestions} soal
          </span>

          <span class="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            {selectedTryout.durationMinutes} menit
          </span>

          <span class="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Percobaan: {getMaxAttemptsLabel(selectedTryout.maxAttempts)}
          </span>

          <span
            class={`rounded-full px-3 py-1 ${getTryoutStatusBadgeClass(
              selectedTryout.status,
            )}`}
          >
            {getTryoutStatusLabel(selectedTryout.status)}
          </span>

          <span class="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            Peserta: {selectedTryout.totalParticipants}
          </span>

          <span class="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
            Pending: {selectedTryout.pendingRequests}
          </span>
        </div>
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
            <p class="text-sm font-semibold text-slate-500">
              Peserta Disetujui
            </p>

            <p class="mt-2 text-3xl font-bold text-slate-950">
              {statistics.summary.totalParticipants}
            </p>

            <p class="mt-1 text-xs font-semibold text-slate-400">
              Pending: {statistics.summary.pendingRequests} · Ditolak:
              {statistics.summary.rejectedParticipants}
            </p>
          </div>

          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-semibold text-slate-500">Sesi Selesai</p>

            <p class="mt-2 text-3xl font-bold text-emerald-700">
              {statistics.summary.finishedSessions}
            </p>

            <p class="mt-1 text-xs font-semibold text-slate-400">
              Total sesi: {statistics.summary.totalSessions}
            </p>
          </div>

          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-semibold text-slate-500">Rata-rata Nilai</p>

            <p class="mt-2 text-3xl font-bold text-blue-900">
              {statistics.summary.averageScore}
            </p>

            <p class="mt-1 text-xs font-semibold text-slate-400">
              Latest avg: {statistics.summary.averageLatestScore ?? 0}
            </p>
          </div>

          <div
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p class="text-sm font-semibold text-slate-500">Completion Rate</p>

            <p class="mt-2 text-3xl font-bold text-slate-950">
              {statistics.summary.completionRate}%
            </p>

            <span
              class={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${getTrendClass(
                statistics.summary.trend,
              )}`}
            >
              {getTrendLabel(statistics.summary.trend)}
            </span>
          </div>
        </div>

        <div
          class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div class="border-b border-slate-100 p-5">
            <h3 class="text-lg font-bold text-slate-950">
              Progress Curve per Percobaan
            </h3>

            <p class="mt-1 text-sm text-slate-500">
              Rata-rata performa peserta berdasarkan attempt ke-1, ke-2, dan
              seterusnya.
            </p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-left text-sm">
              <thead
                class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"
              >
                <tr>
                  <th class="px-5 py-4">Percobaan</th>
                  <th class="px-5 py-4">Sesi Selesai</th>
                  <th class="px-5 py-4">Rata-rata Nilai</th>
                  <th class="px-5 py-4">Rata-rata Benar</th>
                  <th class="px-5 py-4">Rata-rata Salah</th>
                  <th class="px-5 py-4">Completion</th>
                </tr>
              </thead>

              <tbody>
                {#if !statistics.progressCurve || statistics.progressCurve.length === 0}
                  <tr>
                    <td
                      colspan="6"
                      class="px-5 py-8 text-center text-sm text-slate-500"
                    >
                      Belum ada data attempt yang selesai.
                    </td>
                  </tr>
                {:else}
                  {#each statistics.progressCurve as item}
                    <tr class="border-t border-slate-100">
                      <td class="px-5 py-4 font-bold text-slate-900">
                        Attempt #{item.attemptNumber}
                      </td>

                      <td class="px-5 py-4 font-semibold text-slate-700">
                        {item.totalFinishedSessions}
                      </td>

                      <td class="px-5 py-4 font-bold text-blue-900">
                        {item.averageScore}
                      </td>

                      <td class="px-5 py-4 font-bold text-emerald-700">
                        {item.averageCorrect}
                      </td>

                      <td class="px-5 py-4 font-bold text-red-700">
                        {item.averageWrong}
                      </td>

                      <td class="px-5 py-4 font-semibold text-slate-700">
                        {item.completionRate}%
                      </td>
                    </tr>
                  {/each}
                {/if}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      <div
        class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="border-b border-slate-100 p-5">
          <h3 class="text-lg font-bold text-slate-950">Detail Sesi Siswa</h3>

          <p class="mt-1 text-sm text-slate-500">
            Semua sesi pengerjaan siswa yang sudah menjadi peserta approved.
          </p>
        </div>

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
                    Belum ada siswa approved yang mengerjakan tryout ini.
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
