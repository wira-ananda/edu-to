<script lang="ts">
  import {
    getDifficultyBadgeClass,
    getDifficultyLabel,
    getWeightPriorityLabel,
  } from "$lib/types/questions";

  import type {
    QuestionBankManagementBank,
    QuestionBankManagementQuestion,
  } from "$lib/types/question-management";

  type Props = {
    bank: QuestionBankManagementBank;
    questions: QuestionBankManagementQuestion[];

    deletingQuestionId?: string;
    deletingBank?: boolean;

    canDeleteBank?: boolean;

    onCreateQuestion: () => void;
    onEditQuestion: (questionId: string) => void;
    onDeleteQuestion: (questionId: string) => void | Promise<void>;

    onDeleteBank?: () => void | Promise<void>;
  };

  let {
    bank,
    questions,
    deletingQuestionId = "",
    deletingBank = false,
    canDeleteBank = false,
    onCreateQuestion,
    onEditQuestion,
    onDeleteQuestion,
    onDeleteBank,
  }: Props = $props();
</script>

<section
  class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
>
  <div class="border-b border-slate-100 p-5 sm:p-6">
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <p
          class="text-[10px] font-black uppercase tracking-[0.16em] text-[#0c438c]"
        >
          Bank Aktif
        </p>

        <h3 class="mt-1 text-xl font-black text-slate-950">
          {bank.name}
        </h3>

        <p class="mt-1 text-sm text-slate-500">
          {questions.length} soal di bank ini.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        {#if canDeleteBank && onDeleteBank}
          <button
            type="button"
            onclick={() => onDeleteBank?.()}
            disabled={deletingBank}
            class="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletingBank ? "Menghapus Bank..." : "Hapus Bank"}
          </button>
        {/if}

        <button
          type="button"
          onclick={onCreateQuestion}
          disabled={deletingBank}
          class="relative overflow-hidden rounded-xl bg-[#062b63] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0c438c] disabled:opacity-50"
        >
          <span class="relative z-10"> + Tambah Soal </span>

          <span class="absolute bottom-0 left-0 h-1 w-full bg-[#f8c900]"></span>
        </button>
      </div>
    </div>

    {#if canDeleteBank && questions.length > 0}
      <div
        class="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5"
      >
        <svg
          class="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>

        <p class="text-xs font-semibold leading-5 text-amber-700">
          Bank yang masih memiliki soal tidak dapat dihapus. Hapus semua soal
          terlebih dahulu jika bank sudah tidak digunakan.
        </p>
      </div>
    {/if}
  </div>

  <div class="overflow-x-auto">
    <table class="w-full min-w-[900px] text-left text-sm">
      <thead
        class="bg-slate-50 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
      >
        <tr>
          <th class="px-5 py-4">Soal</th>
          <th class="px-5 py-4">Difficulty</th>
          <th class="px-5 py-4">Prioritas</th>
          <th class="px-5 py-4 text-right">Aksi</th>
        </tr>
      </thead>

      <tbody>
        {#if questions.length === 0}
          <tr>
            <td colspan="4" class="px-5 py-12 text-center">
              <div
                class="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400"
              >
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path d="M8 6h8" />
                  <path d="M8 10h8" />
                  <path d="M8 14h5" />
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                </svg>
              </div>

              <p class="mt-3 font-bold text-slate-700">
                Bank ini belum memiliki soal.
              </p>

              <button
                type="button"
                onclick={onCreateQuestion}
                class="mt-4 rounded-xl border border-[#0c438c]/20 bg-blue-50 px-4 py-2 text-xs font-bold text-[#0c438c] transition hover:bg-blue-100"
              >
                + Tambah Soal Pertama
              </button>
            </td>
          </tr>
        {:else}
          {#each questions as question}
            <tr
              class="border-t border-slate-100 transition hover:bg-slate-50/70"
            >
              <td class="max-w-xl px-5 py-4">
                <p class="line-clamp-2 font-bold leading-5 text-slate-900">
                  {question.questionText}
                </p>

                {#if question.imageUrl}
                  <span
                    class="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#0c438c]"
                  >
                    Memiliki gambar
                  </span>
                {/if}
              </td>

              <td class="px-5 py-4">
                <span
                  class={`rounded-full px-3 py-1 text-xs font-bold ${getDifficultyBadgeClass(
                    question.difficultyLevel,
                  )}`}
                >
                  {getDifficultyLabel(question.difficultyLevel)}
                </span>
              </td>

              <td class="px-5 py-4">
                <p class="font-bold text-slate-700">
                  {getWeightPriorityLabel(question.weightPriority)}
                </p>

                <p class="mt-0.5 text-xs text-slate-400">
                  Bobot {question.weight}
                </p>
              </td>

              <td class="px-5 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={deletingQuestionId === question.id}
                    onclick={() => onEditQuestion(question.id)}
                    class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={deletingQuestionId === question.id}
                    onclick={() => onDeleteQuestion(question.id)}
                    class="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingQuestionId === question.id
                      ? "Menghapus..."
                      : "Hapus"}
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</section>
