<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import {
    getTeacherQuestionBanksCached,
    getTeacherQuestionsCached,
    getTeacherSubjectsCached,
    invalidateTeacherQuestionBanksCache,
    invalidateTeacherQuestionDataCaches,
    invalidateTeacherQuestionsCache,
    invalidateTeacherSubjectsCache,
    readTeacherQuestionBanksCache,
    readTeacherQuestionsCache,
    readTeacherSubjectsCache,
  } from "$lib/cache/teacher-page-cache";
  import {
    getDifficultyBadgeClass,
    getDifficultyLabel,
    getWeightPriorityLabel,
  } from "$lib/types/questions";
  import type {
    TeacherQuestionBanksResponse,
    TeacherQuestionsResponse,
    TeacherSubjectsResponse,
  } from "$lib/types/teacher";

  type CreateSubjectResponse = {
    ok: boolean;
    subject: {
      id: string;
      name: string;
    };
  };

  let loading = $state(true);
  let refreshing = $state(false);
  let deletingId = $state("");
  let creatingSubject = $state(false);

  let showCreateBank = $state(false);

  let errorMessage = $state("");
  let successMessage = $state("");

  let newSubjectName = $state("");

  let banks = $state<TeacherQuestionBanksResponse["banks"]>([]);

  let questions = $state<TeacherQuestionsResponse["questions"]>([]);

  let subjects = $state<TeacherSubjectsResponse["subjects"]>([]);

  let selectedSubjectId = $state("");

  const selectedBank = $derived(
    banks.find((bank) => bank.id === selectedSubjectId) ?? null,
  );

  const selectedQuestions = $derived(
    questions.filter((question) => question.subjectId === selectedSubjectId),
  );

  function resolveSelectedBank() {
    const requestedBank = page.url.searchParams.get("bank");

    if (
      requestedBank &&
      subjects.some((subject) => subject.id === requestedBank)
    ) {
      selectedSubjectId = requestedBank;
      return;
    }

    if (
      selectedSubjectId &&
      subjects.some((subject) => subject.id === selectedSubjectId)
    ) {
      return;
    }

    selectedSubjectId = subjects[0]?.id ?? "";
  }

  async function loadData(
    options: {
      force?: boolean;
    } = {},
  ) {
    const force = options.force ?? false;

    errorMessage = "";

    const cachedBanks = !force ? readTeacherQuestionBanksCache() : null;

    const cachedQuestions = !force ? readTeacherQuestionsCache() : null;

    const cachedSubjects = !force ? readTeacherSubjectsCache() : null;

    if (cachedBanks) {
      banks = cachedBanks;
    }

    if (cachedQuestions) {
      questions = cachedQuestions;
    }

    if (cachedSubjects) {
      subjects = cachedSubjects;
    }

    if (cachedBanks && cachedQuestions && cachedSubjects) {
      resolveSelectedBank();
      loading = false;
      return;
    }

    loading =
      banks.length === 0 && questions.length === 0 && subjects.length === 0;

    try {
      const [nextBanks, nextQuestions, nextSubjects] = await Promise.all([
        getTeacherQuestionBanksCached({
          force,
        }),

        getTeacherQuestionsCached({
          force,
        }),

        getTeacherSubjectsCached({
          force,
        }),
      ]);

      banks = nextBanks;
      questions = nextQuestions;
      subjects = nextSubjects;

      resolveSelectedBank();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat bank soal.";
    } finally {
      loading = false;
    }
  }

  async function refreshData() {
    refreshing = true;
    successMessage = "";

    invalidateTeacherQuestionBanksCache();
    invalidateTeacherQuestionsCache();
    invalidateTeacherSubjectsCache();

    try {
      await loadData({
        force: true,
      });
    } finally {
      refreshing = false;
    }
  }

  function selectBank(bankId: string) {
    selectedSubjectId = bankId;
    errorMessage = "";
    successMessage = "";
  }

  function openNewQuestion() {
    if (!selectedSubjectId) {
      errorMessage = "Buat atau pilih bank soal terlebih dahulu.";
      return;
    }

    void goto(`/teacher/questions/new?subjectId=${selectedSubjectId}`);
  }

  function openEditQuestion(questionId: string) {
    void goto(
      `/teacher/questions/${questionId}/edit?bank=${selectedSubjectId}`,
    );
  }

  async function createSubject(event: SubmitEvent) {
    event.preventDefault();

    const name = newSubjectName.trim();

    if (!name) {
      errorMessage = "Nama bank soal wajib diisi.";

      return;
    }

    creatingSubject = true;

    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<CreateSubjectResponse>(
        "/teacher/subjects",
        {
          method: "POST",
          body: JSON.stringify({
            name,
          }),
        },
      );

      newSubjectName = "";

      invalidateTeacherQuestionBanksCache();
      invalidateTeacherSubjectsCache();

      await loadData();

      selectedSubjectId = result.subject.id;

      showCreateBank = false;

      successMessage = "Bank soal berhasil dibuat.";
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal membuat bank soal.";
    } finally {
      creatingSubject = false;
    }
  }

  async function deleteQuestion(id: string) {
    const confirmed = confirm("Hapus soal ini?");

    if (!confirmed) {
      return;
    }

    deletingId = id;

    errorMessage = "";
    successMessage = "";

    try {
      await apiFetch(`/teacher/questions/${id}`, {
        method: "DELETE",
      });

      invalidateTeacherQuestionDataCaches(id);

      await loadData();

      successMessage = "Soal berhasil dihapus.";
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus soal.";
    } finally {
      deletingId = "";
    }
  }

  onMount(() => {
    void loadData();
  });
</script>

<section class="space-y-6">
  <!-- Header -->
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
        onclick={refreshData}
        disabled={loading || refreshing}
        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        {refreshing ? "Memuat..." : "Refresh"}
      </button>

      <button
        type="button"
        onclick={() => (showCreateBank = !showCreateBank)}
        class="rounded-xl border border-[#0c438c]/20 bg-blue-50 px-4 py-2.5 text-sm font-bold text-[#0c438c]"
      >
        + Bank Soal
      </button>

      <button
        type="button"
        onclick={openNewQuestion}
        disabled={!selectedSubjectId}
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
    <form
      onsubmit={createSubject}
      class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div class="absolute left-0 top-0 h-full w-1 bg-[#f8c900]"></div>

      <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div class="min-w-0 flex-1">
          <label for="subjectName" class="text-sm font-bold text-slate-700">
            Nama Bank Soal
          </label>

          <input
            id="subjectName"
            type="text"
            bind:value={newSubjectName}
            disabled={creatingSubject}
            placeholder="Contoh: Matematika Kelas 12"
            class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
          />
        </div>

        <div class="flex gap-2">
          <button
            type="button"
            onclick={() => (showCreateBank = false)}
            disabled={creatingSubject}
            class="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={creatingSubject || !newSubjectName.trim()}
            class="rounded-xl bg-[#062b63] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {creatingSubject ? "Membuat..." : "Buat Bank"}
          </button>
        </div>
      </div>
    </form>
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
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0c438c]"
      >
        <svg
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"
          />

          <path
            d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z"
          />
        </svg>
      </div>

      <h3 class="mt-4 text-lg font-black text-slate-950">
        Belum ada bank soal
      </h3>

      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Buat bank soal terlebih dahulu. Setelah itu kamu dapat menambahkan soal
        ke dalam bank tersebut.
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
    <!-- Bank selector -->
    <section>
      <div class="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 class="text-base font-black text-slate-950">Pilih Bank Soal</h3>

          <p class="mt-1 text-sm text-slate-500">
            {banks.length} bank soal tersedia.
          </p>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {#each banks as bank}
          <button
            type="button"
            onclick={() => selectBank(bank.id)}
            class={`relative overflow-hidden rounded-2xl border p-5 text-left shadow-sm transition ${
              selectedSubjectId === bank.id
                ? "border-[#0c438c] bg-white shadow-md"
                : "border-slate-200 bg-white hover:border-blue-200"
            }`}
          >
            {#if selectedSubjectId === bank.id}
              <div
                class="absolute left-0 top-0 h-full w-1.5 bg-[#f8c900]"
              ></div>

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
                {bank.totalQuestions}
              </span>
              soal
            </p>

            <div class="mt-4 grid grid-cols-3 gap-2">
              <div class="rounded-lg bg-emerald-50 px-2 py-2 text-center">
                <p class="text-[10px] font-bold uppercase text-emerald-600">
                  Mudah
                </p>

                <p class="mt-0.5 text-sm font-black text-emerald-700">
                  {bank.difficultyCounts.LOW}
                </p>
              </div>

              <div class="rounded-lg bg-amber-50 px-2 py-2 text-center">
                <p class="text-[10px] font-bold uppercase text-amber-600">
                  Sedang
                </p>

                <p class="mt-0.5 text-sm font-black text-amber-700">
                  {bank.difficultyCounts.MEDIUM}
                </p>
              </div>

              <div class="rounded-lg bg-red-50 px-2 py-2 text-center">
                <p class="text-[10px] font-bold uppercase text-red-500">
                  Sulit
                </p>

                <p class="mt-0.5 text-sm font-black text-red-600">
                  {bank.difficultyCounts.HIGH}
                </p>
              </div>
            </div>
          </button>
        {/each}
      </div>
    </section>

    {#if selectedBank}
      <!-- Selected bank -->
      <section
        class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div class="border-b border-slate-100 p-5 sm:p-6">
          <div
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p
                class="text-[10px] font-black uppercase tracking-[0.16em] text-[#0c438c]"
              >
                Bank Aktif
              </p>

              <h3 class="mt-1 text-xl font-black text-slate-950">
                {selectedBank.name}
              </h3>

              <p class="mt-1 text-sm text-slate-500">
                {selectedQuestions.length}
                soal di bank ini.
              </p>
            </div>

            <button
              type="button"
              onclick={openNewQuestion}
              class="w-fit rounded-xl bg-[#062b63] px-4 py-2.5 text-sm font-bold text-white"
            >
              + Tambah Soal ke Bank Ini
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px] text-left text-sm">
            <thead
              class="bg-slate-50 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
            >
              <tr>
                <th class="px-5 py-4"> Soal </th>

                <th class="px-5 py-4"> Difficulty </th>

                <th class="px-5 py-4"> Prioritas </th>

                <th class="px-5 py-4 text-right"> Aksi </th>
              </tr>
            </thead>

            <tbody>
              {#if selectedQuestions.length === 0}
                <tr>
                  <td colspan="4" class="px-5 py-12 text-center">
                    <p class="font-bold text-slate-700">
                      Bank ini belum memiliki soal.
                    </p>

                    <p class="mt-1 text-sm text-slate-400">
                      Tambahkan soal pertama ke
                      {selectedBank.name}.
                    </p>
                  </td>
                </tr>
              {:else}
                {#each selectedQuestions as question}
                  <tr
                    class="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td class="max-w-xl px-5 py-4">
                      <p
                        class="line-clamp-2 font-bold leading-5 text-slate-900"
                      >
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
                          onclick={() => openEditQuestion(question.id)}
                          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === question.id}
                          onclick={() => deleteQuestion(question.id)}
                          class="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === question.id
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
    {/if}
  {/if}
</section>
