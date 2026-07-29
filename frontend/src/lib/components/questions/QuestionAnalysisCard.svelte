<script lang="ts">
  import {
    getDifficultyLabel,
    getWeightPriorityLabel,
  } from "$lib/types/questions";

  import type { AnalyzeResult } from "$lib/types/questions";

  type Props = {
    result: AnalyzeResult | null;

    analyzing?: boolean;
    disabled?: boolean;

    onAnalyze: () => void | Promise<void>;
  };

  let {
    result,
    analyzing = false,
    disabled = false,
    onAnalyze,
  }: Props = $props();
</script>

<section
  class="relative overflow-hidden rounded-2xl bg-[#062b63] p-5 text-white shadow-sm sm:p-6"
>
  <div
    class="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rotate-12 rounded-[40px] bg-[#0c438c]"
  ></div>

  <div
    class="pointer-events-none absolute right-0 top-0 h-full w-16 bg-[#f8c900]"
    style="clip-path: polygon(100% 0, 100% 100%, 45% 100%, 90% 0);"
  ></div>

  <div
    class="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-200">
        Analisis Otomatis
      </p>

      <h3 class="mt-1 text-lg font-black">Analisis tingkat kesulitan</h3>

      <p class="mt-1 max-w-xl text-sm text-blue-100/75">
        Sistem membaca teks dan indikator soal untuk menentukan tingkat
        kesulitan.
      </p>
    </div>

    <button
      type="button"
      onclick={() => onAnalyze()}
      disabled={analyzing || disabled}
      class="w-fit shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#062b63] transition hover:bg-blue-50 disabled:opacity-50"
    >
      {analyzing
        ? "Menganalisis..."
        : result
          ? "Analisis Ulang"
          : "Analisis Soal"}
    </button>
  </div>

  {#if result}
    <div class="relative z-10 mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-xl border border-white/10 bg-white/10 p-4">
        <p class="text-[10px] font-bold uppercase tracking-wide text-blue-200">
          Difficulty
        </p>

        <p class="mt-1 text-lg font-black">
          {getDifficultyLabel(result.difficultyLevel)}
        </p>
      </div>

      <div class="rounded-xl border border-white/10 bg-white/10 p-4">
        <p class="text-[10px] font-bold uppercase tracking-wide text-blue-200">
          Difficulty Score
        </p>

        <p class="mt-1 text-lg font-black">
          {result.difficultyScore}
        </p>
      </div>

      <div class="rounded-xl border border-white/10 bg-white/10 p-4">
        <p class="text-[10px] font-bold uppercase tracking-wide text-blue-200">
          Prioritas
        </p>

        <p class="mt-1 text-lg font-black">
          {getWeightPriorityLabel(result.weightPriority)}
        </p>
      </div>

      <div class="rounded-xl border border-white/10 bg-white/10 p-4">
        <p class="text-[10px] font-bold uppercase tracking-wide text-blue-200">
          Bobot WRS
        </p>

        <p class="mt-1 text-lg font-black text-[#f8c900]">
          {result.weight}
        </p>
      </div>
    </div>

    {#if result.detectedIndicators.length > 0}
      <div
        class="relative z-10 mt-4 rounded-xl border border-white/10 bg-white/10 p-4"
      >
        <p class="text-xs font-bold text-blue-100">Indikator terdeteksi</p>

        <div class="mt-2 flex flex-wrap gap-2">
          {#each result.detectedIndicators as indicator}
            <span
              class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-blue-50"
            >
              {indicator}
            </span>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</section>
