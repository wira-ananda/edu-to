<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import {
    getAdminTryoutResultsCached,
    getAdminTryoutsCached,
    getAdminTryoutStatisticsCached,
    invalidateAdminTryoutResultsCache,
    invalidateAdminTryoutsCache,
    invalidateAdminTryoutStatisticsCache,
    readAdminTryoutResultsCache,
    readAdminTryoutsCache,
    readAdminTryoutStatisticsCache,
  } from "$lib/cache/admin-page-cache";

  import ResultMetricCard from "$lib/components/results/ResultMetricCard.svelte";
  import SessionResultsTable from "$lib/components/results/SessionResultsTable.svelte";
  import TryoutProgressChart from "$lib/components/results/TryoutProgressChart.svelte";

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
  let refreshing = $state(false);

  let errorMessage = $state("");

  let tryouts = $state<AdminTryoutsResponse["tryouts"]>([]);
  let selectedTryoutId = $state("");

  let sessions = $state<TryoutResultsResponse["sessions"]>([]);
  let statistics = $state<TryoutStatisticsResponse | null>(null);

  const selectedTryout = $derived(
    tryouts.find((tryout) => tryout.id === selectedTryoutId) ?? null,
  );

  const progressCurve = $derived(statistics?.progressCurve ?? []);

  const ongoingSessions = $derived(
    sessions.filter((session) => session.status === "ONGOING").length,
  );

  const trend = $derived(statistics?.summary.trend ?? "NO_DATA");

  const trendLabel = $derived.by(() => {
    if (trend === "IMPROVING") {
      return "Meningkat";
    }

    if (trend === "DECLINING") {
      return "Menurun";
    }

    if (trend === "STABLE") {
      return "Stabil";
    }

    return "Belum ada data";
  });

  const trendTone = $derived.by(
    (): "default" | "blue" | "green" | "amber" | "red" => {
      if (trend === "IMPROVING") {
        return "green";
      }

      if (trend === "DECLINING") {
        return "red";
      }

      if (trend === "STABLE") {
        return "blue";
      }

      return "default";
    },
  );

  const trendDescription = $derived.by(() => {
    if (progressCurve.length === 0) {
      return "Belum ada percobaan yang selesai.";
    }

    if (progressCurve.length === 1) {
      return `Rata-rata percobaan pertama ${
        progressCurve[0]?.averageScore ?? 0
      }.`;
    }

    const first = progressCurve[0]?.averageScore ?? 0;

    const latest = progressCurve[progressCurve.length - 1]?.averageScore ?? 0;

    const difference = latest - first;

    if (difference > 0) {
      return `Naik ${difference} poin, dari ${first} menjadi ${latest}.`;
    }

    if (difference < 0) {
      return `Turun ${Math.abs(
        difference,
      )} poin, dari ${first} menjadi ${latest}.`;
    }

    return `Tetap pada rata-rata ${latest}.`;
  });

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

  function resolveSelectedTryout() {
    const currentTryout = tryouts.find(
      (tryout) => tryout.id === selectedTryoutId,
    );

    if (currentTryout) {
      return;
    }

    const queryTryoutId = page.url.searchParams.get("tryoutId");

    const tryoutFromQuery = tryouts.find(
      (tryout) => tryout.id === queryTryoutId,
    );

    selectedTryoutId = tryoutFromQuery?.id ?? tryouts[0]?.id ?? "";
  }

  async function loadTryouts(
    options: {
      force?: boolean;
    } = {},
  ) {
    const force = options.force ?? false;

    const cachedTryouts = !force ? readAdminTryoutsCache() : null;

    if (cachedTryouts) {
      tryouts = cachedTryouts;

      resolveSelectedTryout();

      return;
    }

    tryouts = await getAdminTryoutsCached({
      force,
    });

    resolveSelectedTryout();
  }

  async function loadResults(
    options: {
      force?: boolean;
    } = {},
  ) {
    const force = options.force ?? false;

    const requestedTryoutId = selectedTryoutId;

    if (!requestedTryoutId) {
      sessions = [];
      statistics = null;
      loadingResults = false;

      return;
    }

    errorMessage = "";

    const cachedResults = !force
      ? readAdminTryoutResultsCache(requestedTryoutId)
      : null;

    const cachedStatistics = !force
      ? readAdminTryoutStatisticsCache(requestedTryoutId)
      : null;

    if (cachedResults) {
      sessions = cachedResults.sessions;
    } else {
      sessions = [];
    }

    if (cachedStatistics) {
      statistics = cachedStatistics;
    } else {
      statistics = null;
    }

    if (cachedResults && cachedStatistics) {
      loadingResults = false;

      return;
    }

    loadingResults = true;

    try {
      const [resultsResult, statisticsResult] = await Promise.all([
        getAdminTryoutResultsCached(requestedTryoutId, {
          force,
        }),

        getAdminTryoutStatisticsCached(requestedTryoutId, {
          force,
        }),
      ]);

      /*
       * Proteksi race condition.
       *
       * Kalau user sudah pindah tryout sebelum request selesai,
       * response lama tidak boleh menimpa data tryout baru.
       */
      if (selectedTryoutId !== requestedTryoutId) {
        return;
      }

      sessions = resultsResult.sessions;

      statistics = statisticsResult;
    } catch (error) {
      if (selectedTryoutId === requestedTryoutId) {
        errorMessage =
          error instanceof Error ? error.message : "Gagal memuat hasil siswa.";
      }
    } finally {
      if (selectedTryoutId === requestedTryoutId) {
        loadingResults = false;
      }
    }
  }

  async function handleTryoutChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;

    const nextTryoutId = select.value;

    if (!nextTryoutId || nextTryoutId === selectedTryoutId) {
      return;
    }

    selectedTryoutId = nextTryoutId;

    await goto(`/admin/results?tryoutId=${encodeURIComponent(nextTryoutId)}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });

    await loadResults();
  }

  async function refreshResults() {
    if (!selectedTryoutId || refreshing) {
      return;
    }

    refreshing = true;
    errorMessage = "";

    const currentTryoutId = selectedTryoutId;

    invalidateAdminTryoutsCache();

    invalidateAdminTryoutResultsCache(currentTryoutId);

    invalidateAdminTryoutStatisticsCache(currentTryoutId);

    try {
      await loadTryouts({
        force: true,
      });

      if (tryouts.some((tryout) => tryout.id === currentTryoutId)) {
        selectedTryoutId = currentTryoutId;
      }

      await loadResults({
        force: true,
      });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memperbarui hasil.";
    } finally {
      refreshing = false;
    }
  }

  onMount(async () => {
    loading = true;
    errorMessage = "";

    try {
      await loadTryouts();

      await loadResults();
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal memuat data hasil siswa.";
    } finally {
      loading = false;
    }
  });
</script>

<section class="space-y-5">
  <!-- Header -->
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <p class="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
        Analitik Tryout
      </p>

      <h2 class="mt-1 text-2xl font-black tracking-tight text-slate-950">
        Hasil Siswa
      </h2>

      <p class="mt-1 text-sm text-slate-500">
        Pantau penyelesaian, nilai, dan perkembangan peserta seluruh tryout.
      </p>
    </div>

    <button
      type="button"
      onclick={refreshResults}
      disabled={loading || refreshing || loadingResults || !selectedTryoutId}
      class="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        class={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" />
        <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
      </svg>

      {refreshing ? "Memperbarui..." : "Refresh"}
    </button>
  </div>

  <!-- Error -->
  {#if errorMessage}
    <div
      class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </div>
  {/if}

  <!-- Initial loading -->
  {#if loading}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="flex items-center gap-3">
        <div
          class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#123c8c]"
        ></div>

        <p class="text-sm font-semibold text-slate-500">
          Memuat hasil siswa...
        </p>
      </div>
    </div>
  {:else if tryouts.length === 0}
    <!-- Empty tryout -->
    <div
      class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
    >
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
      >
        <svg
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="m7 15 4-4 3 2 5-6" />
        </svg>
      </div>

      <h3 class="mt-3 font-black text-slate-900">Belum ada tryout</h3>

      <p class="mt-1 text-sm text-slate-500">
        Buat tryout terlebih dahulu sebelum melihat hasil siswa.
      </p>

      <button
        type="button"
        onclick={() => goto("/admin/tryouts/new")}
        class="mt-4 rounded-xl bg-[#062b63] px-4 py-2.5 text-sm font-bold text-white"
      >
        + Buat Tryout
      </button>
    </div>
  {:else}
    <!-- Tryout context -->
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div>
          <label
            for="tryoutId"
            class="text-xs font-black uppercase tracking-[0.12em] text-slate-400"
          >
            Tryout yang dianalisis
          </label>

          <select
            id="tryoutId"
            value={selectedTryoutId}
            onchange={handleTryoutChange}
            disabled={loadingResults}
            class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
          >
            {#each tryouts as tryout}
              <option value={tryout.id}>
                {tryout.title} · {tryout.bank.name} · {getOwnerLabel(tryout)}
              </option>
            {/each}
          </select>
        </div>

        {#if selectedTryout}
          <button
            type="button"
            onclick={() =>
              goto(`/admin/tryouts/${selectedTryout.id}/participants`)}
            class="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
          >
            Kelola Peserta
          </button>
        {/if}
      </div>

      {#if selectedTryout}
        <div
          class="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"
        >
          <span
            class="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#123c8c]"
          >
            {getOwnerLabel(selectedTryout)}
          </span>

          <span
            class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"
          >
            {selectedTryout.totalQuestions} soal
          </span>

          <span
            class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"
          >
            {selectedTryout.durationMinutes} menit
          </span>

          <span
            class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"
          >
            {getMaxAttemptsLabel(selectedTryout.maxAttempts)}
          </span>

          <span
            class={`rounded-full px-3 py-1.5 text-xs font-bold ${getTryoutStatusBadgeClass(
              selectedTryout.status,
            )}`}
          >
            {getTryoutStatusLabel(selectedTryout.status)}
          </span>

          <span
            class="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
          >
            {selectedTryout.totalParticipants} peserta
          </span>

          {#if selectedTryout.pendingRequests > 0}
            <button
              type="button"
              onclick={() =>
                goto(`/admin/tryouts/${selectedTryout.id}/participants`)}
              class="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
            >
              {selectedTryout.pendingRequests} menunggu persetujuan →
            </button>
          {/if}
        </div>
      {/if}
    </section>

    <!-- Results loading -->
    {#if loadingResults}
      <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div class="flex items-center gap-3">
          <div
            class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#123c8c]"
          ></div>

          <p class="text-sm font-semibold text-slate-500">
            Memuat analitik tryout...
          </p>
        </div>
      </div>
    {:else}
      {#if statistics}
        <!-- KPI -->
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ResultMetricCard
            label="Peserta Disetujui"
            value={statistics.summary.totalParticipants}
            helper={`${statistics.summary.pendingRequests} menunggu · ${statistics.summary.rejectedParticipants} ditolak`}
          />

          <ResultMetricCard
            label="Penyelesaian"
            value={`${statistics.summary.completionRate}%`}
            tone="green"
            helper={`${statistics.summary.totalFinishedParticipants ?? 0} dari ${statistics.summary.totalParticipants} peserta telah menyelesaikan`}
          />

          <ResultMetricCard
            label="Rata-rata Nilai"
            value={statistics.summary.averageScore}
            tone="blue"
            helper={`Rata-rata nilai terbaru: ${statistics.summary.averageLatestScore ?? 0}`}
          />

          <ResultMetricCard
            label="Tren Performa"
            value={trendLabel}
            tone={trendTone}
            badge={ongoingSessions > 0 ? `${ongoingSessions} sesi aktif` : ""}
            badgeTone={ongoingSessions > 0 ? "amber" : "default"}
            helper={trendDescription}
          />
        </div>

        <!-- Score range -->
        {#if statistics.summary.finishedSessions > 0}
          <div
            class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3"
          >
            <div class="px-2 py-1">
              <p
                class="text-xs font-bold uppercase tracking-wide text-slate-400"
              >
                Nilai Tertinggi
              </p>

              <p class="mt-1 text-xl font-black text-emerald-700">
                {statistics.summary.highestScore}
              </p>
            </div>

            <div class="border-slate-100 px-2 py-1 sm:border-x sm:px-5">
              <p
                class="text-xs font-bold uppercase tracking-wide text-slate-400"
              >
                Nilai Terendah
              </p>

              <p class="mt-1 text-xl font-black text-red-600">
                {statistics.summary.lowestScore}
              </p>
            </div>

            <div class="px-2 py-1 sm:px-5">
              <p
                class="text-xs font-bold uppercase tracking-wide text-slate-400"
              >
                Sesi Selesai
              </p>

              <p class="mt-1 text-xl font-black text-slate-900">
                {statistics.summary.finishedSessions}

                <span class="text-sm font-semibold text-slate-400">
                  / {statistics.summary.totalSessions}
                </span>
              </p>
            </div>
          </div>
        {/if}

        <!-- Shared progress component -->
        <TryoutProgressChart items={progressCurve} />
      {/if}

      <!-- Shared sessions component -->
      <SessionResultsTable {sessions} />
    {/if}
  {/if}
</section>
