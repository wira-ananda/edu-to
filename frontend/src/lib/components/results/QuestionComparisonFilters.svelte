<script lang="ts">
  import type {
    TeacherComparisonAnswerStatus,
    TeacherComparisonDifficulty,
  } from "$lib/types/teacher";

  type Props = {
    attempts: number[];
    selectedAttempt: number;

    search: string;
    difficultyLevel: TeacherComparisonDifficulty;
    answerStatus: TeacherComparisonAnswerStatus;

    loading?: boolean;

    onAttemptChange: (value: number) => void | Promise<void>;
    onSearchChange: (value: string) => void;
    onSearchSubmit: () => void | Promise<void>;

    onDifficultyChange: (
      value: TeacherComparisonDifficulty,
    ) => void | Promise<void>;

    onAnswerStatusChange: (
      value: TeacherComparisonAnswerStatus,
    ) => void | Promise<void>;

    onReset: () => void | Promise<void>;
  };

  let {
    attempts,
    selectedAttempt,
    search,
    difficultyLevel,
    answerStatus,
    loading = false,
    onAttemptChange,
    onSearchChange,
    onSearchSubmit,
    onDifficultyChange,
    onAnswerStatusChange,
    onReset,
  }: Props = $props();

  const hasActiveFilter = $derived(
    Boolean(search.trim()) ||
      difficultyLevel !== "ALL" ||
      answerStatus !== "ALL",
  );

  function handleAttemptChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const value = Number(select.value);

    if (!Number.isInteger(value) || value < 1) {
      return;
    }

    void onAttemptChange(value);
  }

  function handleDifficultyChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;

    void onDifficultyChange(select.value as TeacherComparisonDifficulty);
  }

  function handleAnswerStatusChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;

    void onAnswerStatusChange(select.value as TeacherComparisonAnswerStatus);
  }

  function handleSearchKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    void onSearchSubmit();
  }
</script>

<section
  class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
>
  <div class="border-b border-slate-100 px-5 py-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p
          class="text-[10px] font-black uppercase tracking-[0.16em] text-[#0c438c]"
        >
          Filter Perbandingan
        </p>

        <h2 class="mt-1 text-base font-black text-slate-950">
          Percobaan dan peserta
        </h2>
      </div>

      <span
        class="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-[#0c438c]"
      >
        Percobaan ke-{selectedAttempt}
      </span>
    </div>
  </div>

  <div class="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
    <div>
      <label
        for="comparisonAttempt"
        class="text-xs font-black uppercase tracking-wide text-slate-500"
      >
        Percobaan
      </label>

      <select
        id="comparisonAttempt"
        value={selectedAttempt}
        disabled={loading || attempts.length === 0}
        onchange={handleAttemptChange}
        class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {#if attempts.length === 0}
          <option value={selectedAttempt}>Belum ada percobaan</option>
        {:else}
          {#each attempts as attempt}
            <option value={attempt}>
              Percobaan ke-{attempt}
            </option>
          {/each}
        {/if}
      </select>

      <p class="mt-2 text-xs leading-5 text-slate-400">
        Data setiap percobaan ditampilkan secara terpisah.
      </p>
    </div>

    <div>
      <label
        for="comparisonSearch"
        class="text-xs font-black uppercase tracking-wide text-slate-500"
      >
        Cari Siswa
      </label>

      <div class="relative mt-2">
        <svg
          class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>

        <input
          id="comparisonSearch"
          type="search"
          value={search}
          disabled={loading}
          placeholder="Nama atau kelas siswa"
          oninput={(event) => onSearchChange(event.currentTarget.value)}
          onkeydown={handleSearchKeydown}
          class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-20 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
        />

        <button
          type="button"
          disabled={loading}
          onclick={() => void onSearchSubmit()}
          class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#062b63] px-3 py-2 text-xs font-black text-white transition hover:bg-[#0c438c] disabled:opacity-50"
        >
          Cari
        </button>
      </div>
    </div>

    <div>
      <label
        for="comparisonDifficulty"
        class="text-xs font-black uppercase tracking-wide text-slate-500"
      >
        Tingkat Kesulitan
      </label>

      <select
        id="comparisonDifficulty"
        value={difficultyLevel}
        disabled={loading}
        onchange={handleDifficultyChange}
        class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
      >
        <option value="ALL">Semua tingkat</option>
        <option value="LOW">Mudah</option>
        <option value="MEDIUM">Sedang</option>
        <option value="HIGH">Sulit</option>
      </select>
    </div>

    <div>
      <label
        for="comparisonAnswerStatus"
        class="text-xs font-black uppercase tracking-wide text-slate-500"
      >
        Hasil Jawaban
      </label>

      <select
        id="comparisonAnswerStatus"
        value={answerStatus}
        disabled={loading}
        onchange={handleAnswerStatusChange}
        class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
      >
        <option value="ALL">Semua hasil</option>
        <option value="CORRECT">Benar</option>
        <option value="WRONG">Salah</option>
        <option value="UNANSWERED">Tidak dijawab</option>
      </select>
    </div>
  </div>

  {#if hasActiveFilter}
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3"
    >
      <p class="text-xs font-semibold text-slate-500">
        Filter tambahan sedang diterapkan.
      </p>

      <button
        type="button"
        disabled={loading}
        onclick={() => void onReset()}
        class="text-xs font-black text-[#0c438c] transition hover:text-[#062b63] disabled:opacity-50"
      >
        Reset filter
      </button>
    </div>
  {/if}
</section>
