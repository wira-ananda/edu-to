<script lang="ts">
  import type { QuestionBankManagementBank } from "$lib/types/question-management";

  type Props = {
    banks: QuestionBankManagementBank[];

    selectedBankId: string;

    disabled?: boolean;

    onSelect: (bankId: string) => void | Promise<void>;
  };

  let { banks, selectedBankId, disabled = false, onSelect }: Props = $props();

  function getDifficultyCount(
    bank: QuestionBankManagementBank,
    level: "LOW" | "MEDIUM" | "HIGH",
  ) {
    return bank.difficultyCounts?.[level] ?? 0;
  }
</script>

<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
  {#each banks as bank (bank.id)}
    <button
      type="button"
      {disabled}
      onclick={() => onSelect(bank.id)}
      class={`relative overflow-hidden rounded-2xl border p-5 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
        selectedBankId === bank.id
          ? "border-[#0c438c] bg-white shadow-md"
          : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-md"
      }`}
    >
      {#if selectedBankId === bank.id}
        <div class="absolute left-0 top-0 h-full w-1.5 bg-[#f8c900]"></div>

        <div
          class="absolute right-3 top-3 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#0c438c]"
        >
          Dipilih
        </div>
      {/if}

      <p class="pr-16 text-base font-black text-slate-950">
        {bank.name}
      </p>

      <p class="mt-2 text-sm text-slate-500">
        <span class="font-black text-slate-900">
          {bank.totalQuestions ?? 0}
        </span>

        soal
      </p>

      <div class="mt-4 grid grid-cols-3 gap-2">
        <div class="rounded-lg bg-emerald-50 px-2 py-2 text-center">
          <p class="text-[10px] font-bold uppercase text-emerald-600">Mudah</p>

          <p class="mt-0.5 text-sm font-black text-emerald-700">
            {getDifficultyCount(bank, "LOW")}
          </p>
        </div>

        <div class="rounded-lg bg-amber-50 px-2 py-2 text-center">
          <p class="text-[10px] font-bold uppercase text-amber-600">Sedang</p>

          <p class="mt-0.5 text-sm font-black text-amber-700">
            {getDifficultyCount(bank, "MEDIUM")}
          </p>
        </div>

        <div class="rounded-lg bg-red-50 px-2 py-2 text-center">
          <p class="text-[10px] font-bold uppercase text-red-500">Sulit</p>

          <p class="mt-0.5 text-sm font-black text-red-600">
            {getDifficultyCount(bank, "HIGH")}
          </p>
        </div>
      </div>
    </button>
  {/each}
</div>
