<script lang="ts">
  type Props = {
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;

    hasDuplicateOptions?: boolean;

    disabled?: boolean;
  };

  let {
    optionA = $bindable(),
    optionB = $bindable(),
    optionC = $bindable(),
    optionD = $bindable(),

    hasDuplicateOptions = false,

    disabled = false,
  }: Props = $props();
</script>

<section
  class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
>
  <div class="mb-5">
    <p class="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
      02 · Pilihan Jawaban
    </p>

    <h3 class="mt-1 text-lg font-black text-slate-950">
      Isi empat pilihan jawaban
    </h3>

    <p class="mt-1 text-sm text-slate-500">
      Pastikan setiap pilihan memiliki isi yang berbeda.
    </p>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <div>
      <label
        for="optionA"
        class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
      >
        <span
          class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#062b63] text-xs font-black text-white"
        >
          A
        </span>

        Pilihan A
      </label>

      <input
        id="optionA"
        bind:value={optionA}
        {disabled}
        placeholder="Isi pilihan A"
        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
      />
    </div>

    <div>
      <label
        for="optionB"
        class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
      >
        <span
          class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#062b63] text-xs font-black text-white"
        >
          B
        </span>

        Pilihan B
      </label>

      <input
        id="optionB"
        bind:value={optionB}
        {disabled}
        placeholder="Isi pilihan B"
        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
      />
    </div>

    <div>
      <label
        for="optionC"
        class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
      >
        <span
          class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#062b63] text-xs font-black text-white"
        >
          C
        </span>

        Pilihan C
      </label>

      <input
        id="optionC"
        bind:value={optionC}
        {disabled}
        placeholder="Isi pilihan C"
        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
      />
    </div>

    <div>
      <label
        for="optionD"
        class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
      >
        <span
          class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#062b63] text-xs font-black text-white"
        >
          D
        </span>

        Pilihan D
      </label>

      <input
        id="optionD"
        bind:value={optionD}
        {disabled}
        placeholder="Isi pilihan D"
        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
      />
    </div>
  </div>

  {#if hasDuplicateOptions}
    <p
      class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600"
    >
      Pilihan jawaban A, B, C, dan D tidak boleh memiliki isi yang sama.
    </p>
  {/if}
</section>
