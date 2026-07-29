<script lang="ts">
  import CreateQuestionBankPanel from "./CreateQuestionBankPanel.svelte";
  import QuestionBankSelector from "./QuestionBankSelector.svelte";
  import QuestionTable from "./QuestionTable.svelte";

  import type {
    QuestionBankManagementBank,
    QuestionBankManagementQuestion,
  } from "$lib/types/question-management";

  type Props = {
    banks: QuestionBankManagementBank[];
    questions: QuestionBankManagementQuestion[];

    selectedBankId: string;

    loading?: boolean;
    refreshing?: boolean;
    creatingBank?: boolean;

    deletingBankId?: string;
    deletingQuestionId?: string;

    errorMessage?: string;
    successMessage?: string;

    canDeleteBank?: boolean;

    onRefresh: () => void | Promise<void>;
    onSelectBank: (bankId: string) => void | Promise<void>;
    onCreateBank: (name: string) => Promise<boolean>;
    onDeleteBank?: () => void | Promise<void>;

    onCreateQuestion: () => void;
    onEditQuestion: (questionId: string) => void;
    onDeleteQuestion: (questionId: string) => void | Promise<void>;
  };

  let {
    banks,
    questions,
    selectedBankId,

    loading = false,
    refreshing = false,
    creatingBank = false,

    deletingBankId = "",
    deletingQuestionId = "",

    errorMessage = "",
    successMessage = "",

    canDeleteBank = false,

    onRefresh,
    onSelectBank,
    onCreateBank,
    onDeleteBank,

    onCreateQuestion,
    onEditQuestion,
    onDeleteQuestion,
  }: Props = $props();

  let search = $state("");
  let showCreateBank = $state(false);

  const selectedBank = $derived(
    banks.find((bank) => bank.id === selectedBankId) ?? null,
  );

  const filteredBanks = $derived.by(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return banks;
    }

    return banks.filter((bank) => bank.name.toLowerCase().includes(keyword));
  });

  const isMutating = $derived(
    Boolean(creatingBank || deletingBankId || deletingQuestionId),
  );

  async function createBank(name: string) {
    const success = await onCreateBank(name);

    if (success) {
      showCreateBank = false;
      search = "";
    }

    return success;
  }
</script>

<section class="space-y-6">
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <p class="text-xs font-black uppercase tracking-[0.16em] text-[#0c438c]">
        Pembelajaran
      </p>

      <h2 class="mt-1 text-2xl font-black tracking-tight text-slate-950">
        Bank Soal
      </h2>

      <p class="mt-1 text-sm text-slate-500">
        Pilih bank soal untuk melihat dan mengelola soal di dalamnya.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        onclick={() => onRefresh()}
        disabled={loading || refreshing || isMutating}
        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        {refreshing ? "Memuat..." : "Refresh"}
      </button>

      <button
        type="button"
        disabled={isMutating}
        onclick={() => (showCreateBank = !showCreateBank)}
        class="rounded-xl border border-[#0c438c]/20 bg-blue-50 px-4 py-2.5 text-sm font-bold text-[#0c438c] transition hover:bg-blue-100 disabled:opacity-50"
      >
        + Bank Soal
      </button>

      <button
        type="button"
        onclick={onCreateQuestion}
        disabled={!selectedBankId || isMutating}
        class="relative overflow-hidden rounded-xl bg-[#062b63] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0c438c] disabled:opacity-50"
      >
        <span class="relative z-10"> + Tambah Soal </span>

        <span class="absolute bottom-0 left-0 h-1 w-full bg-[#f8c900]"></span>
      </button>
    </div>
  </div>

  {#if errorMessage}
    <div
      class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </div>
  {/if}

  {#if successMessage}
    <div
      class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
    >
      {successMessage}
    </div>
  {/if}

  {#if showCreateBank}
    <CreateQuestionBankPanel
      creating={creatingBank}
      onCancel={() => (showCreateBank = false)}
      onSubmit={createBank}
    />
  {/if}

  {#if loading}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="flex items-center gap-3">
        <div
          class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0c438c]"
        ></div>

        <p class="text-sm font-semibold text-slate-500">Memuat bank soal...</p>
      </div>
    </div>
  {:else if banks.length === 0}
    <div
      class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
    >
      <h3 class="text-lg font-black text-slate-950">Belum ada bank soal</h3>

      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Buat bank soal terlebih dahulu sebelum menambahkan soal.
      </p>

      <button
        type="button"
        onclick={() => (showCreateBank = true)}
        class="mt-5 rounded-xl bg-[#062b63] px-5 py-2.5 text-sm font-bold text-white"
      >
        Buat Bank Soal
      </button>
    </div>
  {:else}
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <input
        type="text"
        bind:value={search}
        placeholder="Cari bank soal..."
        class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white"
      />
    </div>

    {#if filteredBanks.length === 0}
      <div
        class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"
      >
        <p class="text-sm font-semibold text-slate-500">
          Bank soal tidak ditemukan.
        </p>
      </div>
    {:else}
      <div>
        <div class="mb-3">
          <h3 class="text-base font-black text-slate-950">Pilih Bank Soal</h3>

          <p class="mt-1 text-sm text-slate-500">
            {filteredBanks.length} bank soal ditampilkan.
          </p>
        </div>

        <QuestionBankSelector
          banks={filteredBanks}
          {selectedBankId}
          disabled={Boolean(deletingBankId)}
          onSelect={onSelectBank}
        />
      </div>
    {/if}

    {#if selectedBank}
      <QuestionTable
        bank={selectedBank}
        {questions}
        {deletingQuestionId}
        deletingBank={deletingBankId === selectedBank.id}
        {canDeleteBank}
        {onDeleteBank}
        {onCreateQuestion}
        {onEditQuestion}
        {onDeleteQuestion}
      />
    {/if}
  {/if}
</section>
