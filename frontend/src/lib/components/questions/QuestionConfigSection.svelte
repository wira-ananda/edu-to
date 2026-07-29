<script lang="ts">
  import {
    answerOptions,
    getWeightFromPriority,
    weightPriorityOptions,
  } from "$lib/types/questions";

  import type { AnswerOption, WeightPriority } from "$lib/types/questions";

  type Props = {
    correctAnswer: AnswerOption;
    weightPriority: WeightPriority;

    disabled?: boolean;

    onPriorityChange: () => void;
  };

  let {
    correctAnswer = $bindable(),
    weightPriority = $bindable(),

    disabled = false,

    onPriorityChange,
  }: Props = $props();
</script>

<section
  class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
>
  <div class="mb-5">
    <p class="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
      03 · Pengaturan
    </p>

    <h3 class="mt-1 text-lg font-black text-slate-950">
      Jawaban dan prioritas
    </h3>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <div>
      <label for="correctAnswer" class="text-sm font-bold text-slate-700">
        Jawaban Benar
      </label>

      <select
        id="correctAnswer"
        bind:value={correctAnswer}
        {disabled}
        class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
      >
        {#each answerOptions as option}
          <option value={option}>
            Pilihan {option}
          </option>
        {/each}
      </select>
    </div>

    <div>
      <label for="weightPriority" class="text-sm font-bold text-slate-700">
        Prioritas Kemunculan
      </label>

      <select
        id="weightPriority"
        bind:value={weightPriority}
        onchange={onPriorityChange}
        {disabled}
        class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
      >
        {#each weightPriorityOptions as option}
          <option value={option.value}>
            {option.label}
            · Bobot {option.weight}
          </option>
        {/each}
      </select>

      <p class="mt-2 text-xs text-slate-400">
        Bobot WRS:
        <span class="font-bold text-slate-600">
          {getWeightFromPriority(weightPriority)}
        </span>
      </p>
    </div>
  </div>
</section>
