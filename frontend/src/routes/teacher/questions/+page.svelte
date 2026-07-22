<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
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

  let loading = $state(true);
  let refreshing = $state(false);
  let deletingId = $state("");
  let creatingSubject = $state(false);
  let errorMessage = $state("");

  let newSubjectName = $state("");
  let subjectFilter = $state("");

  let banks = $state<TeacherQuestionBanksResponse["banks"]>([]);
  let questions = $state<TeacherQuestionsResponse["questions"]>([]);
  let subjects = $state<TeacherSubjectsResponse["subjects"]>([]);

  const filteredQuestions = $derived.by(() => {
    if (!subjectFilter) return questions;

    return questions.filter((question) => question.subjectId === subjectFilter);
  });

  async function loadData() {
    errorMessage = "";
    loading = questions.length === 0;

    try {
      const [banksResult, questionsResult, subjectsResult] = await Promise.all([
        apiFetch<TeacherQuestionBanksResponse>("/teacher/question-banks"),
        apiFetch<TeacherQuestionsResponse>("/teacher/questions"),
        apiFetch<TeacherSubjectsResponse>("/teacher/subjects"),
      ]);

      banks = banksResult.banks;
      questions = questionsResult.questions;
      subjects = subjectsResult.subjects;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat bank soal.";
    } finally {
      loading = false;
    }
  }

  async function refreshData() {
    refreshing = true;

    try {
      await loadData();
    } finally {
      refreshing = false;
    }
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

    try {
      await apiFetch("/teacher/subjects", {
        method: "POST",
        body: JSON.stringify({
          name,
        }),
      });

      newSubjectName = "";
      await loadData();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal membuat bank soal.";
    } finally {
      creatingSubject = false;
    }
  }

  async function deleteQuestion(id: string) {
    const confirmed = confirm("Hapus soal ini?");

    if (!confirmed) return;

    deletingId = id;
    errorMessage = "";

    try {
      await apiFetch(`/teacher/questions/${id}`, {
        method: "DELETE",
      });

      await loadData();
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
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <h2 class="text-2xl font-bold text-slate-950">Bank Soal Guru</h2>

      <p class="mt-1 text-sm text-slate-500">
        Kelola bank soal dan soal milikmu sendiri.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        onclick={refreshData}
        disabled={loading || refreshing}
        class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-60"
      >
        {refreshing ? "Memuat..." : "Refresh"}
      </button>

      <button
        type="button"
        onclick={() => goto("/teacher/questions/new")}
        class="rounded-xl bg-blue-900 px-4 py-2 text-sm font-bold text-white"
      >
        + Tambah Soal
      </button>
    </div>
  </div>

  {#if errorMessage}
    <p
      class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </p>
  {/if}

  <form
    class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto]"
    onsubmit={createSubject}
  >
    <div>
      <label for="subjectName" class="text-sm font-bold text-slate-700">
        Buat Bank Soal Baru
      </label>

      <input
        id="subjectName"
        type="text"
        bind:value={newSubjectName}
        disabled={creatingSubject}
        placeholder="Contoh: Matematika Kelas 12"
        class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
      />
    </div>

    <button
      type="submit"
      disabled={creatingSubject || !newSubjectName.trim()}
      class="self-end rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
    >
      {creatingSubject ? "Membuat..." : "Buat Bank"}
    </button>
  </form>

  {#if loading}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-500">Memuat data...</p>
    </div>
  {:else}
    <div class="grid gap-4 md:grid-cols-3">
      {#each banks as bank}
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-lg font-bold text-slate-950">{bank.name}</p>

          <p class="mt-2 text-sm text-slate-500">
            Total soal: <span class="font-bold text-slate-950"
              >{bank.totalQuestions}</span
            >
          </p>

          <div class="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div
              class="rounded-xl bg-emerald-50 p-2 font-bold text-emerald-700"
            >
              Mudah {bank.difficultyCounts.LOW}
            </div>

            <div class="rounded-xl bg-amber-50 p-2 font-bold text-amber-700">
              Sedang {bank.difficultyCounts.MEDIUM}
            </div>

            <div class="rounded-xl bg-red-50 p-2 font-bold text-red-700">
              Sulit {bank.difficultyCounts.HIGH}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h3 class="text-lg font-bold text-slate-950">Daftar Soal</h3>

          <p class="mt-1 text-sm text-slate-500">
            Total soal tampil: {filteredQuestions.length}
          </p>
        </div>

        <div>
          <label for="subjectFilter" class="text-sm font-bold text-slate-700">
            Filter Bank Soal
          </label>

          <select
            id="subjectFilter"
            bind:value={subjectFilter}
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white sm:w-64"
          >
            <option value="">Semua bank soal</option>

            {#each subjects as subject}
              <option value={subject.id}>{subject.name}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="mt-5 overflow-x-auto">
        <table class="w-full min-w-[1000px] text-left text-sm">
          <thead
            class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"
          >
            <tr>
              <th class="px-5 py-4">Soal</th>
              <th class="px-5 py-4">Bank</th>
              <th class="px-5 py-4">Difficulty</th>
              <th class="px-5 py-4">Priority</th>
              <th class="px-5 py-4">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {#if filteredQuestions.length === 0}
              <tr>
                <td colspan="5" class="px-5 py-10 text-center text-slate-500">
                  Belum ada soal.
                </td>
              </tr>
            {:else}
              {#each filteredQuestions as question}
                <tr class="border-t border-slate-100">
                  <td class="px-5 py-4">
                    <p class="line-clamp-2 font-bold text-slate-900">
                      {question.questionText}
                    </p>

                    {#if question.imageUrl}
                      <p class="mt-1 text-xs font-semibold text-blue-700">
                        Memiliki gambar
                      </p>
                    {/if}
                  </td>

                  <td class="px-5 py-4 font-semibold text-slate-700">
                    {question.subject.name}
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

                  <td class="px-5 py-4 font-semibold text-slate-700">
                    {getWeightPriorityLabel(question.weightPriority)}
                    <span class="text-slate-400">({question.weight})</span>
                  </td>

                  <td class="px-5 py-4">
                    <div class="flex gap-2">
                      <button
                        type="button"
                        onclick={() =>
                          goto(`/teacher/questions/${question.id}/edit`)}
                        class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === question.id}
                        onclick={() => deleteQuestion(question.id)}
                        class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 disabled:opacity-50"
                      >
                        {deletingId === question.id ? "Menghapus..." : "Hapus"}
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
  {/if}
</section>
