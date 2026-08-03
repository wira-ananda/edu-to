<script lang="ts">
  import type { TeacherQuestionComparisonItem } from "$lib/types/teacher";

  type Props = {
    items: TeacherQuestionComparisonItem[];
    loading?: boolean;

    onViewDetail: (item: TeacherQuestionComparisonItem) => void;
  };

  let { items, loading = false, onViewDetail }: Props = $props();

  function getDifficultyLabel(level: "LOW" | "MEDIUM" | "HIGH") {
    const labels = {
      LOW: "Mudah",
      MEDIUM: "Sedang",
      HIGH: "Sulit",
    };

    return labels[level];
  }

  function getDifficultyClass(level: "LOW" | "MEDIUM" | "HIGH") {
    const classes = {
      LOW: "bg-emerald-50 text-emerald-700",
      MEDIUM: "bg-amber-50 text-amber-700",
      HIGH: "bg-red-50 text-red-700",
    };

    return classes[level];
  }

  function getPriorityLabel(priority: "LOW" | "NORMAL" | "HIGH" | "VERY_HIGH") {
    const labels = {
      LOW: "Rendah",
      NORMAL: "Normal",
      HIGH: "Tinggi",
      VERY_HIGH: "Sangat Tinggi",
    };

    return labels[priority];
  }

  function getAnswerLabel(status: "CORRECT" | "WRONG" | "UNANSWERED") {
    const labels = {
      CORRECT: "Benar",
      WRONG: "Salah",
      UNANSWERED: "Tidak Dijawab",
    };

    return labels[status];
  }

  function getAnswerClass(status: "CORRECT" | "WRONG" | "UNANSWERED") {
    const classes = {
      CORRECT: "bg-emerald-50 text-emerald-700",
      WRONG: "bg-red-50 text-red-700",
      UNANSWERED: "bg-slate-100 text-slate-600",
    };

    return classes[status];
  }
</script>

<section
  class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
  aria-busy={loading}
>
  <div
    class="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-base font-black text-slate-950">
          Soal yang Diterima Peserta
        </h2>

        <span
          class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600"
        >
          {items.length} sesi
        </span>
      </div>

      <p class="mt-1 text-xs leading-5 text-slate-500">
        Data diurutkan berdasarkan nama siswa.
      </p>
    </div>

    {#if loading}
      <div
        class="inline-flex items-center gap-2 text-xs font-bold text-[#0c438c]"
      >
        <span
          class="h-4 w-4 animate-spin rounded-full border-2 border-[#0c438c] border-t-transparent"
        ></span>

        Memuat data...
      </div>
    {/if}
  </div>

  {#if items.length === 0 && !loading}
    <div class="px-6 py-14 text-center">
      <div
        class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
      >
        <svg
          class="h-7 w-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M4 5h16v14H4z" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
        </svg>
      </div>

      <h3 class="mt-4 text-sm font-black text-slate-800">
        Data soal belum tersedia
      </h3>

      <p class="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
        Tidak ditemukan sesi atau soal yang sesuai dengan nomor, percobaan, dan
        filter yang dipilih.
      </p>
    </div>
  {:else}
    <div
      class={`transition-opacity duration-200 ${
        loading ? "pointer-events-none opacity-50" : "opacity-100"
      }`}
    >
      <!-- Desktop -->
      <div class="hidden overflow-x-auto lg:block">
        <table class="w-full min-w-[1120px] text-left text-sm">
          <thead
            class="bg-slate-50 text-[10px] uppercase tracking-[0.1em] text-slate-500"
          >
            <tr>
              <th scope="col" class="px-5 py-4">Siswa</th>
              <th scope="col" class="w-[34%] px-5 py-4">Soal Diterima</th>
              <th scope="col" class="px-5 py-4">Pemilihan</th>
              <th scope="col" class="px-5 py-4">Prioritas</th>
              <th scope="col" class="px-5 py-4">Hasil</th>
              <th scope="col" class="px-5 py-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {#each items as item}
              <tr
                class="border-t border-slate-100 transition hover:bg-slate-50/70"
              >
                <td class="px-5 py-4 align-top">
                  <p class="font-black text-slate-900">
                    {item.student.name}
                  </p>

                  <p class="mt-1 text-xs font-medium text-slate-400">
                    {item.student.className ?? "Kelas belum diisi"}
                  </p>

                  <span
                    class="mt-2 inline-flex rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black text-[#0c438c]"
                  >
                    Percobaan ke-{item.attemptNumber}
                  </span>
                </td>

                <td class="px-5 py-4 align-top">
                  {#if item.question}
                    <p
                      class="line-clamp-3 max-w-xl font-semibold leading-6 text-slate-700"
                    >
                      {item.question.questionText}
                    </p>

                    {#if item.question.imageUrl}
                      <div
                        class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500"
                      >
                        <svg
                          class="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <circle cx="8.5" cy="10" r="1.5" />
                          <path d="m21 15-5-5L5 19" />
                        </svg>

                        Memiliki gambar
                      </div>
                    {/if}
                  {:else}
                    <p class="text-sm font-semibold text-slate-400">
                      Belum ada soal pada urutan ini.
                    </p>
                  {/if}
                </td>

                <td class="px-5 py-4 align-top">
                  {#if item.question && item.selection}
                    <div class="space-y-2">
                      <div>
                        <p
                          class="text-[10px] font-black uppercase tracking-wide text-slate-400"
                        >
                          Level Saat Dipilih
                        </p>

                        <p class="mt-1 font-black text-slate-800">
                          {item.selection.currentLevel}
                        </p>
                      </div>

                      <span
                        class={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${getDifficultyClass(
                          item.question.difficultyLevel,
                        )}`}
                      >
                        {getDifficultyLabel(item.question.difficultyLevel)}
                      </span>
                    </div>
                  {:else}
                    <span class="font-bold text-slate-300">—</span>
                  {/if}
                </td>

                <td class="px-5 py-4 align-top">
                  {#if item.question}
                    <p class="font-black text-slate-800">
                      {getPriorityLabel(item.question.weightPriority)}
                    </p>

                    <div class="mt-2 flex items-center gap-2">
                      <span
                        class="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#062b63] px-2 font-black text-[#f8c900]"
                      >
                        {item.question.weight}
                      </span>

                      <span class="text-xs font-semibold text-slate-400">
                        bobot
                      </span>
                    </div>
                  {:else}
                    <span class="font-bold text-slate-300">—</span>
                  {/if}
                </td>

                <td class="px-5 py-4 align-top">
                  <span
                    class={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${getAnswerClass(
                      item.answer.status,
                    )}`}
                  >
                    {getAnswerLabel(item.answer.status)}
                  </span>

                  {#if item.answer.selectedAnswer}
                    <p class="mt-2 text-xs font-semibold text-slate-400">
                      Jawaban: {item.answer.selectedAnswer}
                    </p>
                  {/if}
                </td>

                <td class="px-5 py-4 text-right align-top">
                  <button
                    type="button"
                    disabled={!item.question}
                    onclick={() => onViewDetail(item)}
                    class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-[#0c438c] transition hover:border-[#0c438c] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Detail

                    <svg
                      class="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Mobile -->
      <div class="divide-y divide-slate-100 lg:hidden">
        {#each items as item}
          <article class="space-y-4 p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate font-black text-slate-900">
                  {item.student.name}
                </h3>

                <p class="mt-1 text-xs font-medium text-slate-400">
                  {item.student.className ?? "Kelas belum diisi"}
                  · Percobaan ke-{item.attemptNumber}
                </p>
              </div>

              <span
                class={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${getAnswerClass(
                  item.answer.status,
                )}`}
              >
                {getAnswerLabel(item.answer.status)}
              </span>
            </div>

            <div class="rounded-xl bg-slate-50 p-4">
              <p
                class="text-[10px] font-black uppercase tracking-wide text-slate-400"
              >
                Soal yang diterima
              </p>

              <p
                class="mt-2 line-clamp-4 text-sm font-semibold leading-6 text-slate-700"
              >
                {item.question?.questionText ??
                  "Belum ada soal pada urutan ini."}
              </p>
            </div>

            {#if item.question && item.selection}
              <div class="grid grid-cols-3 gap-2">
                <div class="rounded-xl bg-slate-50 p-3">
                  <p class="text-[9px] font-black uppercase text-slate-400">
                    Level
                  </p>

                  <p class="mt-1 text-xs font-black text-slate-800">
                    {item.selection.currentLevel}
                  </p>
                </div>

                <div class="rounded-xl bg-slate-50 p-3">
                  <p class="text-[9px] font-black uppercase text-slate-400">
                    Kesulitan
                  </p>

                  <p class="mt-1 text-xs font-black text-slate-800">
                    {getDifficultyLabel(item.question.difficultyLevel)}
                  </p>
                </div>

                <div class="rounded-xl bg-slate-50 p-3">
                  <p class="text-[9px] font-black uppercase text-slate-400">
                    Bobot
                  </p>

                  <p class="mt-1 text-xs font-black text-slate-800">
                    {item.question.weight}
                  </p>
                </div>
              </div>
            {/if}

            <button
              type="button"
              disabled={!item.question}
              onclick={() => onViewDetail(item)}
              class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-[#0c438c] transition hover:bg-blue-50 disabled:opacity-40"
            >
              Lihat Detail Soal
            </button>
          </article>
        {/each}
      </div>
    </div>
  {/if}
</section>
