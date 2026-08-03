<script lang="ts">
  type Props = {
    totalQuestions: number;
    selectedNumber: number;
    disabled?: boolean;
    onSelect: (questionNumber: number) => void | Promise<void>;
  };

  let {
    totalQuestions,
    selectedNumber,
    disabled = false,
    onSelect,
  }: Props = $props();

  const questionNumbers = $derived(
    Array.from({ length: totalQuestions }, (_, index) => index + 1),
  );

  function handleSelect(questionNumber: number) {
    if (disabled || questionNumber === selectedNumber) {
      return;
    }

    void onSelect(questionNumber);
  }
</script>

<section
  class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
>
  <div
    class="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <p
        class="text-[10px] font-black uppercase tracking-[0.16em] text-[#0c438c]"
      >
        Urutan Pengerjaan
      </p>

      <h2 class="mt-1 text-base font-black text-slate-950">Pilih nomor soal</h2>

      <p class="mt-1 text-xs leading-5 text-slate-500">
        Bandingkan soal yang diterima peserta pada posisi yang sama.
      </p>
    </div>

    <div
      class="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-50 px-3 py-2"
    >
      <span
        class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#062b63] text-xs font-black text-[#f8c900]"
      >
        {selectedNumber}
      </span>

      <p class="text-xs font-bold text-[#0c438c]">
        dari {totalQuestions} soal
      </p>
    </div>
  </div>

  <div class="overflow-x-auto px-5 py-4">
    <div
      class="flex min-w-max items-center gap-2"
      role="tablist"
      aria-label="Nomor soal"
    >
      {#each questionNumbers as questionNumber}
        <button
          type="button"
          role="tab"
          aria-selected={questionNumber === selectedNumber}
          aria-label={`Tampilkan perbandingan soal nomor ${questionNumber}`}
          {disabled}
          onclick={() => handleSelect(questionNumber)}
          class={`relative flex h-10 min-w-10 items-center justify-center overflow-hidden rounded-xl border px-3 text-sm font-black transition ${
            questionNumber === selectedNumber
              ? "border-[#062b63] bg-[#062b63] text-white shadow-sm"
              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#0c438c] hover:bg-blue-50 hover:text-[#0c438c]"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {questionNumber}

          {#if questionNumber === selectedNumber}
            <span class="absolute bottom-0 left-0 h-1 w-full bg-[#f8c900]"
            ></span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
</section>
