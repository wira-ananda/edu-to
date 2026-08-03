<script lang="ts">
  import { onMount } from "svelte";

  import type {
    TeacherComparisonAnswerOption,
    TeacherQuestionComparisonItem,
  } from "$lib/types/teacher";

  type Props = {
    item: TeacherQuestionComparisonItem;
    onClose: () => void;
  };

  type QuestionOption = {
    key: TeacherComparisonAnswerOption;
    text: string;
  };

  let { item, onClose }: Props = $props();

  const options = $derived.by<QuestionOption[]>(() => {
    if (!item.question) {
      return [];
    }

    return [
      {
        key: "A",
        text: item.question.optionA,
      },
      {
        key: "B",
        text: item.question.optionB,
      },
      {
        key: "C",
        text: item.question.optionC,
      },
      {
        key: "D",
        text: item.question.optionD,
      },
    ];
  });

  const answerStatusLabel = $derived.by(() => {
    if (item.answer.status === "CORRECT") {
      return "Jawaban Benar";
    }

    if (item.answer.status === "WRONG") {
      return "Jawaban Salah";
    }

    return "Tidak Dijawab";
  });

  const answerStatusClass = $derived.by(() => {
    if (item.answer.status === "CORRECT") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (item.answer.status === "WRONG") {
      return "bg-red-50 text-red-700";
    }

    return "bg-slate-100 text-slate-600";
  });

  function getOptionClass(option: TeacherComparisonAnswerOption) {
    if (!item.question) {
      return "border-slate-200 bg-white";
    }

    if (option === item.question.correctAnswer) {
      return "border-emerald-300 bg-emerald-50";
    }

    if (
      option === item.answer.selectedAnswer &&
      option !== item.question.correctAnswer
    ) {
      return "border-red-300 bg-red-50";
    }

    return "border-slate-200 bg-white";
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }

  onMount(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeydown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
    };
  });
</script>

<div
  class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
  role="presentation"
  onclick={handleBackdropClick}
>
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="comparison-detail-title"
    class="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl"
  >
    <div class="relative overflow-hidden bg-[#062b63] px-5 py-5 sm:px-6">
      <div class="absolute bottom-0 left-0 h-1.5 w-full bg-[#f8c900]"></div>

      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p
            class="text-[10px] font-black uppercase tracking-[0.16em] text-blue-200"
          >
            Detail Soal Nomor {item.questionNumber}
          </p>

          <h2
            id="comparison-detail-title"
            class="mt-1 truncate text-xl font-black text-white"
          >
            {item.student.name}
          </h2>

          <p class="mt-1 text-xs font-semibold text-blue-200">
            Percobaan ke-{item.attemptNumber}
            · Nilai {item.score}
          </p>
        </div>

        <button
          type="button"
          aria-label="Tutup detail soal"
          onclick={onClose}
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>

    <div class="max-h-[calc(92vh-88px)] overflow-y-auto">
      {#if item.question}
        <div class="space-y-6 p-5 sm:p-6">
          <section>
            <div class="flex flex-wrap items-center gap-2">
              <span
                class={`rounded-full px-3 py-1.5 text-xs font-black ${answerStatusClass}`}
              >
                {answerStatusLabel}
              </span>

              <span
                class="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-[#0c438c]"
              >
                {item.question.difficultyLevel}
              </span>

              <span
                class="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700"
              >
                Bobot {item.question.weight}
              </span>
            </div>

            <h3
              class="mt-4 text-xs font-black uppercase tracking-[0.14em] text-slate-400"
            >
              Pertanyaan
            </h3>

            <p
              class="mt-2 whitespace-pre-wrap text-base font-semibold leading-7 text-slate-800"
            >
              {item.question.questionText}
            </p>

            {#if item.question.imageUrl}
              <figure
                class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
              >
                <img
                  src={item.question.imageUrl}
                  alt={item.question.imageAltText ?? "Gambar pendukung soal"}
                  loading="lazy"
                  class="max-h-80 w-full object-contain"
                />

                {#if item.question.imageAltText}
                  <figcaption
                    class="border-t border-slate-200 px-4 py-3 text-xs leading-5 text-slate-500"
                  >
                    {item.question.imageAltText}
                  </figcaption>
                {/if}
              </figure>
            {/if}
          </section>

          <section>
            <h3
              class="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
            >
              Pilihan Jawaban
            </h3>

            <div class="mt-3 grid gap-3">
              {#each options as option}
                <div
                  class={`rounded-2xl border p-4 ${getOptionClass(option.key)}`}
                >
                  <div class="flex items-start gap-3">
                    <span
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white"
                    >
                      {option.key}
                    </span>

                    <p
                      class="min-w-0 flex-1 text-sm font-semibold leading-6 text-slate-700"
                    >
                      {option.text}
                    </p>

                    <div class="flex shrink-0 flex-col items-end gap-1">
                      {#if option.key === item.question.correctAnswer}
                        <span
                          class="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700"
                        >
                          Kunci Jawaban
                        </span>
                      {/if}

                      {#if option.key === item.answer.selectedAnswer}
                        <span
                          class={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            option.key === item.question.correctAnswer
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          Dipilih Siswa
                        </span>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </section>

          <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p
                class="text-[10px] font-black uppercase tracking-wide text-slate-400"
              >
                Level Pemilihan
              </p>

              <p class="mt-2 text-lg font-black text-slate-900">
                {item.selection?.currentLevel ?? "—"}
              </p>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p
                class="text-[10px] font-black uppercase tracking-wide text-slate-400"
              >
                Kesulitan
              </p>

              <p class="mt-2 text-lg font-black text-slate-900">
                {item.question.difficultyLevel}
              </p>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p
                class="text-[10px] font-black uppercase tracking-wide text-slate-400"
              >
                Prioritas
              </p>

              <p class="mt-2 text-lg font-black text-slate-900">
                {item.question.weightPriority}
              </p>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p
                class="text-[10px] font-black uppercase tracking-wide text-slate-400"
              >
                Bobot
              </p>

              <p class="mt-2 text-lg font-black text-[#0c438c]">
                {item.question.weight}
              </p>
            </div>
          </section>

          {#if item.selection}
            <details
              class="group overflow-hidden rounded-2xl border border-slate-200"
            >
              <summary
                class="flex cursor-pointer list-none items-center justify-between gap-3 bg-slate-50 px-4 py-4"
              >
                <div>
                  <p class="text-sm font-black text-slate-800">
                    Detail Proses Weighted Random Selection
                  </p>

                  <p class="mt-1 text-xs text-slate-500">
                    Informasi teknis saat soal dipilih oleh sistem.
                  </p>
                </div>

                <svg
                  class="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>

              <div
                class="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-2"
              >
                <div>
                  <p class="text-xs font-semibold text-slate-400">
                    Jumlah kandidat
                  </p>

                  <p class="mt-1 font-black text-slate-800">
                    {item.selection.candidateCount}
                  </p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-400">
                    Total bobot kandidat
                  </p>

                  <p class="mt-1 font-black text-slate-800">
                    {item.selection.totalWeight}
                  </p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-400">Nilai acak</p>

                  <p class="mt-1 font-black text-slate-800">
                    {item.selection.randomValue}
                  </p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-400">
                    Bobot soal terpilih
                  </p>

                  <p class="mt-1 font-black text-slate-800">
                    {item.selection.selectedQuestionWeight}
                  </p>
                </div>
              </div>
            </details>
          {/if}

          <div class="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="button"
              onclick={onClose}
              class="rounded-xl bg-[#062b63] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0c438c]"
            >
              Tutup Detail
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
