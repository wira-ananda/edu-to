<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import {
    getAdminQuestionBanksCached,
    getAdminQuestionsCached,
    invalidateAdminQuestionBanksCache,
    invalidateAdminQuestionsCache,
    invalidateAdminTryoutsCache,
    readAdminQuestionBanksCache,
    readAdminQuestionsCache,
  } from "$lib/cache/admin-page-cache";

  import type {
    DifficultyLevel,
    Question,
    QuestionBank,
    WeightPriority,
  } from "$lib/types/questions";
  import {
    getDifficultyBadgeClass,
    getDifficultyLabel,
    getQuestionShortId,
    getWeightPriorityLabel,
    getWeightProgressWidth,
  } from "$lib/types/questions";

  const subjectId = $derived(page.params.subjectId || "");

  let loading = $state(true);
  let refreshing = $state(false);
  let errorMessage = $state("");
  let banks = $state<QuestionBank[]>([]);
  let questions = $state<Question[]>([]);

  let search = $state("");
  let difficultyLevel = $state("");
  let weightPriority = $state("");

  const currentBank = $derived(
    banks.find((bank) => bank.id === subjectId) ?? null,
  );

  async function loadBanks(options: { force?: boolean } = {}) {
    const force = options.force ?? false;

    const cachedBanks = !force ? readAdminQuestionBanksCache() : null;

    if (cachedBanks) {
      banks = cachedBanks;
      return;
    }

    banks = await getAdminQuestionBanksCached({ force });
  }

  async function loadQuestions(options: { force?: boolean } = {}) {
    const force = options.force ?? false;

    loading = questions.length === 0;
    errorMessage = "";

    try {
      if (!subjectId) {
        throw new Error("Subject ID not found.");
      }

      const params = {
        subjectId,
        search,
        difficultyLevel,
        weightPriority,
      };

      const cachedQuestions = !force ? readAdminQuestionsCache(params) : null;

      if (cachedQuestions) {
        questions = cachedQuestions;
        loading = false;
        return;
      }

      questions = await getAdminQuestionsCached(params, { force });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat soal.";
    } finally {
      loading = false;
    }
  }

  async function refreshPage() {
    refreshing = true;
    invalidateAdminQuestionBanksCache();
    invalidateAdminQuestionsCache(subjectId);

    try {
      await loadBanks({ force: true });
      await loadQuestions({ force: true });
    } finally {
      refreshing = false;
    }
  }

  async function deleteQuestion(id: string) {
    const confirmed = confirm("Hapus soal ini?");

    if (!confirmed) return;

    try {
      await apiFetch(`/admin/questions/${id}`, {
        method: "DELETE",
      });

      invalidateAdminQuestionBanksCache();
      invalidateAdminQuestionsCache(subjectId);
      invalidateAdminTryoutsCache();

      await loadBanks({ force: true });
      await loadQuestions({ force: true });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus soal.";
    }
  }

  onMount(() => {
    void (async () => {
      try {
        await loadBanks();
        await loadQuestions();
      } catch (error) {
        errorMessage =
          error instanceof Error ? error.message : "Gagal memuat bank soal.";
      }
    })();
  });
</script>

<section class="space-y-5">
  <div
    class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
  >
    <div class="min-w-0">
      <button
        type="button"
        onclick={() => goto("/admin/questions")}
        class="mb-3 text-sm font-bold text-blue-900"
      >
        ← Kembali ke daftar bank soal
      </button>

      <h2 class="truncate text-2xl font-bold text-slate-950">
        Bank Soal {currentBank?.name ?? ""}
      </h2>

      <p class="mt-1 text-sm leading-6 text-slate-500">
        Kelola dan periksa semua soal pada mata pelajaran ini. Total:
        <span class="font-bold text-slate-900">{questions.length}</span>
        soal.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        onclick={refreshPage}
        disabled={loading || refreshing}
        class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"
      >
        {refreshing ? "Memuat..." : "Refresh"}
      </button>

      <button
        type="button"
        onclick={() => goto(`/admin/questions/new?subjectId=${subjectId}`)}
        class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white"
      >
        + Tambah Soal
      </button>
    </div>
  </div>

  {#if currentBank}
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div
        class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <p class="text-sm font-semibold text-slate-500">Total Soal</p>
        <p class="mt-2 text-2xl font-bold text-slate-950">
          {currentBank.totalQuestions}
        </p>
      </div>

      <div
        class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <p class="text-sm font-semibold text-slate-500">Mudah</p>
        <p class="mt-2 text-2xl font-bold text-emerald-700">
          {currentBank.difficultyCounts.LOW}
        </p>
      </div>

      <div
        class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <p class="text-sm font-semibold text-slate-500">Sedang</p>
        <p class="mt-2 text-2xl font-bold text-amber-700">
          {currentBank.difficultyCounts.MEDIUM}
        </p>
      </div>

      <div
        class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <p class="text-sm font-semibold text-slate-500">Sulit</p>
        <p class="mt-2 text-2xl font-bold text-red-700">
          {currentBank.difficultyCounts.HIGH}
        </p>
      </div>
    </div>
  {/if}

  <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <form
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
      onsubmit={(event) => {
        event.preventDefault();
        void loadQuestions({ force: true });
      }}
    >
      <input
        type="text"
        bind:value={search}
        placeholder="Cari isi soal..."
        class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white sm:col-span-2 xl:col-span-2"
      />

      <select
        bind:value={difficultyLevel}
        class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
      >
        <option value="">Semua Tingkat</option>
        <option value="LOW">Mudah</option>
        <option value="MEDIUM">Sedang</option>
        <option value="HIGH">Sulit</option>
      </select>

      <select
        bind:value={weightPriority}
        class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
      >
        <option value="">Semua Prioritas</option>
        <option value="LOW">Rendah</option>
        <option value="NORMAL">Normal</option>
        <option value="HIGH">Tinggi</option>
        <option value="VERY_HIGH">Sangat Tinggi</option>
      </select>

      <button
        type="submit"
        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
      >
        Filter
      </button>
    </form>
  </div>

  {#if errorMessage}
    <p
      class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </p>
  {/if}

  <div class="lg:hidden">
    {#if loading}
      <div
        class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm"
      >
        Memuat data...
      </div>
    {:else if questions.length === 0}
      <div
        class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm"
      >
        Belum ada soal pada bank soal ini.
      </div>
    {:else}
      <div class="space-y-3">
        {#each questions as question, index}
          <article
            class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div class="mb-3 flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold text-slate-400">
                  {getQuestionShortId(index)}
                </p>

                <p class="mt-1 text-sm font-bold text-slate-900">
                  {question.subject.name}
                </p>
              </div>

              <span
                class={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getDifficultyBadgeClass(question.difficultyLevel as DifficultyLevel)}`}
              >
                {getDifficultyLabel(
                  question.difficultyLevel as DifficultyLevel,
                )}
              </span>
            </div>

            <p
              class="line-clamp-4 text-sm font-semibold leading-6 text-slate-900"
            >
              {question.questionText}
            </p>

            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-xl bg-slate-50 p-3">
                <p
                  class="text-xs font-bold uppercase tracking-wide text-slate-400"
                >
                  Prioritas
                </p>

                <p class="mt-1 font-semibold text-slate-700">
                  {getWeightPriorityLabel(
                    question.weightPriority as WeightPriority,
                  )}
                </p>
              </div>

              <div class="rounded-xl bg-slate-50 p-3">
                <p
                  class="text-xs font-bold uppercase tracking-wide text-slate-400"
                >
                  Kunci
                </p>

                <p class="mt-1 font-bold text-slate-900">
                  {question.correctAnswer}
                </p>
              </div>
            </div>

            <div class="mt-4 rounded-xl bg-slate-50 p-3">
              <div class="flex items-center justify-between gap-3">
                <p
                  class="text-xs font-bold uppercase tracking-wide text-slate-400"
                >
                  Bobot Kemunculan
                </p>

                <p class="text-sm font-bold text-slate-900">
                  {question.weight}
                </p>
              </div>

              <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full rounded-full bg-blue-900"
                  style={`width: ${getWeightProgressWidth(question.weight)}`}
                ></div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onclick={() => goto(`/admin/questions/${question.id}/edit`)}
                class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
              >
                Edit
              </button>

              <button
                type="button"
                onclick={() => deleteQuestion(question.id)}
                class="rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-600"
              >
                Hapus
              </button>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </div>

  <div
    class="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block"
  >
    <div class="overflow-x-auto">
      <table class="min-w-[1180px] w-full text-left text-sm">
        <thead
          class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"
        >
          <tr>
            <th class="w-20 px-5 py-4">ID</th>
            <th class="px-5 py-4">Question</th>
            <th class="px-5 py-4">Bank / Subject</th>
            <th class="px-5 py-4">Difficulty</th>
            <th class="px-5 py-4">Prioritas</th>
            <th class="px-5 py-4">Bobot Kemungkinan Kemunculan Soal</th>
            <th class="px-5 py-4">Kunci</th>
            <th class="px-5 py-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {#if loading}
            <tr>
              <td colspan="8" class="px-5 py-10 text-center text-slate-500">
                Memuat data...
              </td>
            </tr>
          {:else if questions.length === 0}
            <tr>
              <td colspan="8" class="px-5 py-10 text-center text-slate-500">
                Belum ada soal pada bank soal ini.
              </td>
            </tr>
          {:else}
            {#each questions as question, index}
              <tr class="border-t border-slate-100 hover:bg-slate-50/60">
                <td class="px-5 py-4 text-xs font-semibold text-slate-400">
                  {getQuestionShortId(index)}
                </td>

                <td class="max-w-xl px-5 py-4">
                  <p
                    class="line-clamp-3 font-semibold leading-6 text-slate-900"
                  >
                    {question.questionText}
                  </p>
                </td>

                <td class="px-5 py-4">
                  <p class="font-semibold text-slate-700">
                    {question.subject.name}
                  </p>
                  <p class="text-xs text-slate-400">SMAN 1 Gowa</p>
                </td>

                <td class="px-5 py-4">
                  <span
                    class={`rounded-full px-3 py-1 text-xs font-bold ${getDifficultyBadgeClass(question.difficultyLevel as DifficultyLevel)}`}
                  >
                    {getDifficultyLabel(
                      question.difficultyLevel as DifficultyLevel,
                    )}
                  </span>
                </td>

                <td class="px-5 py-4 text-slate-600">
                  {getWeightPriorityLabel(
                    question.weightPriority as WeightPriority,
                  )}
                </td>

                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100"
                    >
                      <div
                        class="h-full rounded-full bg-blue-900"
                        style={`width: ${getWeightProgressWidth(question.weight)}`}
                      ></div>
                    </div>

                    <span class="font-bold text-slate-700">
                      {question.weight}
                    </span>
                  </div>
                </td>

                <td class="px-5 py-4 font-bold text-slate-800">
                  {question.correctAnswer}
                </td>

                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <button
                      type="button"
                      onclick={() =>
                        goto(`/admin/questions/${question.id}/edit`)}
                      class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-white"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onclick={() => deleteQuestion(question.id)}
                      class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</section>
