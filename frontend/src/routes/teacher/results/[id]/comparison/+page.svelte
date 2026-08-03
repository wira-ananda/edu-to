<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import QuestionComparisonDetailModal from "$lib/components/results/QuestionComparisonDetailModal.svelte";
  import QuestionComparisonFilters from "$lib/components/results/QuestionComparisonFilters.svelte";
  import QuestionComparisonTable from "$lib/components/results/QuestionComparisonTable.svelte";
  import QuestionNumberTabs from "$lib/components/results/QuestionNumberTabs.svelte";

  import type {
    TeacherComparisonAnswerStatus,
    TeacherComparisonDifficulty,
    TeacherQuestionComparisonItem,
    TeacherQuestionComparisonResponse,
  } from "$lib/types/teacher";

  const MAX_CACHE_ITEMS = 30;

  const responseCache = new Map<string, TeacherQuestionComparisonResponse>();

  const tryoutId = $derived(page.params.id ?? "");

  let initialLoading = $state(true);
  let fetching = $state(false);
  let refreshing = $state(false);

  let errorMessage = $state("");

  let data = $state<TeacherQuestionComparisonResponse | null>(null);
  let selectedItem = $state<TeacherQuestionComparisonItem | null>(null);

  let questionNumber = $state(
    Math.max(1, Number(page.url.searchParams.get("questionNumber")) || 1),
  );

  let selectedAttempt = $state(
    Math.max(1, Number(page.url.searchParams.get("attemptNumber")) || 1),
  );

  let search = $state(page.url.searchParams.get("search") ?? "");

  let difficultyLevel = $state<TeacherComparisonDifficulty>(
    getInitialDifficulty(),
  );

  let answerStatus = $state<TeacherComparisonAnswerStatus>(
    getInitialAnswerStatus(),
  );

  let requestSequence = 0;

  const tryout = $derived(data?.tryout ?? null);
  const summary = $derived(data?.summary ?? null);

  const answeredCount = $derived(
    (summary?.correctCount ?? 0) + (summary?.wrongCount ?? 0),
  );

  const accuracyPercentage = $derived(
    answeredCount > 0
      ? Math.round(((summary?.correctCount ?? 0) / answeredCount) * 100)
      : 0,
  );

  function getInitialDifficulty(): TeacherComparisonDifficulty {
    const value = page.url.searchParams.get("difficultyLevel");

    if (value === "LOW" || value === "MEDIUM" || value === "HIGH") {
      return value;
    }

    return "ALL";
  }

  function getInitialAnswerStatus(): TeacherComparisonAnswerStatus {
    const value = page.url.searchParams.get("answerStatus");

    if (value === "CORRECT" || value === "WRONG" || value === "UNANSWERED") {
      return value;
    }

    return "ALL";
  }

  function buildQueryString() {
    const params = new URLSearchParams();

    params.set("questionNumber", String(questionNumber));
    params.set("attemptNumber", String(selectedAttempt));

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (difficultyLevel !== "ALL") {
      params.set("difficultyLevel", difficultyLevel);
    }

    if (answerStatus !== "ALL") {
      params.set("answerStatus", answerStatus);
    }

    return params.toString();
  }

  function createCacheKey() {
    return `${tryoutId}:${buildQueryString()}`;
  }

  function saveToCache(
    cacheKey: string,
    response: TeacherQuestionComparisonResponse,
  ) {
    if (responseCache.size >= MAX_CACHE_ITEMS) {
      const oldestKey = responseCache.keys().next().value;

      if (oldestKey) {
        responseCache.delete(oldestKey);
      }
    }

    responseCache.set(cacheKey, response);
  }

  function syncUrl() {
    void goto(`/teacher/results/${tryoutId}/comparison?${buildQueryString()}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });
  }

  async function loadComparison(
    options: {
      force?: boolean;
    } = {},
  ) {
    const force = options.force ?? false;

    if (!tryoutId) {
      errorMessage = "Tryout tidak ditemukan.";
      initialLoading = false;

      return;
    }

    const cacheKey = createCacheKey();

    if (!force) {
      const cachedResponse = responseCache.get(cacheKey);

      if (cachedResponse) {
        data = cachedResponse;
        initialLoading = false;
        fetching = false;

        return;
      }
    }

    const currentRequest = ++requestSequence;

    errorMessage = "";
    selectedItem = null;

    initialLoading = data === null;
    fetching = true;

    try {
      const result = await apiFetch<TeacherQuestionComparisonResponse>(
        `/teacher/tryouts/${tryoutId}/question-comparison?${buildQueryString()}`,
      );

      if (currentRequest !== requestSequence) {
        return;
      }

      if (
        result.availableAttempts.length > 0 &&
        !result.availableAttempts.includes(selectedAttempt)
      ) {
        selectedAttempt = result.availableAttempts[0] ?? 1;

        syncUrl();

        await loadComparison({
          force: true,
        });

        return;
      }

      saveToCache(cacheKey, result);
      data = result;
    } catch (error) {
      if (currentRequest !== requestSequence) {
        return;
      }

      errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal memuat perbandingan soal peserta.";
    } finally {
      if (currentRequest === requestSequence) {
        initialLoading = false;
        fetching = false;
      }
    }
  }

  async function selectQuestionNumber(value: number) {
    if (value === questionNumber) {
      return;
    }

    questionNumber = value;

    syncUrl();
    await loadComparison();
  }

  async function changeAttempt(value: number) {
    if (value === selectedAttempt) {
      return;
    }

    selectedAttempt = value;

    syncUrl();
    await loadComparison();
  }

  async function changeDifficulty(value: TeacherComparisonDifficulty) {
    difficultyLevel = value;

    syncUrl();
    await loadComparison();
  }

  async function changeAnswerStatus(value: TeacherComparisonAnswerStatus) {
    answerStatus = value;

    syncUrl();
    await loadComparison();
  }

  async function submitSearch() {
    syncUrl();

    await loadComparison({
      force: true,
    });
  }

  async function resetFilters() {
    search = "";
    difficultyLevel = "ALL";
    answerStatus = "ALL";

    syncUrl();

    await loadComparison({
      force: true,
    });
  }

  async function refreshComparison() {
    refreshing = true;

    responseCache.delete(createCacheKey());

    try {
      await loadComparison({
        force: true,
      });
    } finally {
      refreshing = false;
    }
  }

  onMount(() => {
    syncUrl();
    void loadComparison();
  });
</script>

<svelte:head>
  <title>Perbandingan Soal Peserta</title>
</svelte:head>

<div class="space-y-5">
  <header
    class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
  >
    <div>
      <button
        type="button"
        onclick={() => goto(`/teacher/results?tryoutId=${tryoutId}`)}
        class="inline-flex items-center gap-2 text-sm font-bold text-[#0c438c] transition hover:text-[#062b63]"
      >
        <svg
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>

        Kembali ke Hasil Siswa
      </button>

      <p
        class="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[#0c438c]"
      >
        Analisis Tryout
      </p>

      <h1
        class="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
      >
        Perbandingan Soal Peserta
      </h1>

      <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
        Lihat perbedaan soal yang diterima setiap siswa berdasarkan nomor soal,
        percobaan, tingkat kesulitan, prioritas, bobot, dan hasil jawaban.
      </p>
    </div>

    <button
      type="button"
      disabled={initialLoading || fetching || refreshing}
      onclick={refreshComparison}
      class="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-[#0c438c] shadow-sm transition hover:border-[#0c438c] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {#if refreshing}
        <span
          class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        ></span>
      {:else}
        <svg
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M20 12a8 8 0 1 1-2.34-5.66" />
          <path d="M20 4v6h-6" />
        </svg>
      {/if}

      Muat Ulang
    </button>
  </header>

  {#if errorMessage}
    <div
      role="alert"
      class="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-start gap-3">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 font-black text-red-600"
        >
          !
        </div>

        <p class="text-sm font-semibold leading-6 text-red-700">
          {errorMessage}
        </p>
      </div>

      <button
        type="button"
        onclick={() =>
          loadComparison({
            force: true,
          })}
        class="rounded-xl border border-red-200 px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
      >
        Coba Lagi
      </button>
    </div>
  {/if}

  {#if initialLoading && !data}
    <div class="space-y-4">
      <div class="h-32 animate-pulse rounded-2xl bg-slate-200"></div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {#each Array(4) as _}
          <div class="h-24 animate-pulse rounded-2xl bg-slate-200"></div>
        {/each}
      </div>

      <div class="h-72 animate-pulse rounded-2xl bg-slate-200"></div>
    </div>
  {:else if tryout && summary && data}
    <section
      class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div class="absolute left-0 top-0 h-full w-1.5 bg-[#f8c900]"></div>

      <div
        class="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#0c438c]"
            >
              {tryout.status}
            </span>

            <span
              class="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700"
            >
              Percobaan ke-{selectedAttempt}
            </span>
          </div>

          <h2 class="mt-3 text-xl font-black text-slate-950">
            {tryout.title}
          </h2>

          <div
            class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500"
          >
            <span>
              Bank:
              <strong class="font-bold text-slate-700">
                {tryout.bankName}
              </strong>
            </span>

            <span>
              {tryout.totalQuestions} soal
            </span>

            <span>
              {tryout.durationMinutes} menit
            </span>
          </div>
        </div>

        <div
          class="inline-flex w-fit items-center gap-3 rounded-2xl bg-[#062b63] px-4 py-3 text-white"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#f8c900]"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6" />
              <path d="M22 11h-6" />
            </svg>
          </div>

          <div>
            <p
              class="text-[10px] font-black uppercase tracking-wide text-blue-200"
            >
              Peserta
            </p>

            <p class="text-xl font-black">
              {summary.totalParticipants}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p
          class="text-[10px] font-black uppercase tracking-wide text-slate-400"
        >
          Sesi Ditampilkan
        </p>

        <p class="mt-2 text-2xl font-black text-slate-950">
          {summary.displayedSessions}
        </p>

        <p class="mt-1 text-xs font-semibold text-slate-400">
          Percobaan ke-{selectedAttempt}
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p
          class="text-[10px] font-black uppercase tracking-wide text-slate-400"
        >
          Variasi Soal
        </p>

        <p class="mt-2 text-2xl font-black text-[#0c438c]">
          {summary.uniqueQuestions}
        </p>

        <p class="mt-1 text-xs font-semibold text-slate-400">
          Soal berbeda pada nomor ini
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p
          class="text-[10px] font-black uppercase tracking-wide text-slate-400"
        >
          Benar dan Salah
        </p>

        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-black text-emerald-600">
            {summary.correctCount}
          </span>

          <span class="font-black text-slate-300">/</span>

          <span class="text-2xl font-black text-red-600">
            {summary.wrongCount}
          </span>
        </div>

        <p class="mt-1 text-xs font-semibold text-slate-400">
          Jawaban pada nomor terpilih
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p
          class="text-[10px] font-black uppercase tracking-wide text-slate-400"
        >
          Akurasi Jawaban
        </p>

        <p class="mt-2 text-2xl font-black text-slate-950">
          {accuracyPercentage}%
        </p>

        <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full bg-[#0c438c]"
            style={`width: ${accuracyPercentage}%`}
          ></div>
        </div>
      </div>
    </section>

    <QuestionComparisonFilters
      attempts={data.availableAttempts}
      {selectedAttempt}
      {search}
      {difficultyLevel}
      {answerStatus}
      loading={fetching}
      onAttemptChange={changeAttempt}
      onSearchChange={(value) => {
        search = value;
      }}
      onSearchSubmit={submitSearch}
      onDifficultyChange={changeDifficulty}
      onAnswerStatusChange={changeAnswerStatus}
      onReset={resetFilters}
    />
    <QuestionNumberTabs
      totalQuestions={tryout.totalQuestions}
      selectedNumber={questionNumber}
      disabled={fetching}
      onSelect={selectQuestionNumber}
    />

    <div class="flex flex-wrap gap-2">
      <span
        class="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700"
      >
        Mudah {summary.difficultyCounts.LOW}
      </span>

      <span
        class="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700"
      >
        Sedang {summary.difficultyCounts.MEDIUM}
      </span>

      <span
        class="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-700"
      >
        Sulit {summary.difficultyCounts.HIGH}
      </span>

      {#if summary.unansweredCount > 0}
        <span
          class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600"
        >
          Tidak dijawab {summary.unansweredCount}
        </span>
      {/if}
    </div>

    <QuestionComparisonTable
      items={data.items}
      loading={fetching}
      onViewDetail={(item) => {
        selectedItem = item;
      }}
    />
  {/if}
</div>

{#if selectedItem}
  <QuestionComparisonDetailModal
    item={selectedItem}
    onClose={() => {
      selectedItem = null;
    }}
  />
{/if}
