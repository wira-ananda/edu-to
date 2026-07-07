<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type {
    DifficultyLevel,
    Question,
    Subject,
    WeightPriority,
  } from "$lib/types/admin";

  let loading = $state(true);
  let questions = $state<Question[]>([]);
  let subjects = $state<Subject[]>([]);
  let errorMessage = $state("");

  let search = $state("");
  let subjectId = $state("");
  let difficultyLevel = $state("");
  let weightPriority = $state("");

  async function loadSubjects() {
    const result = await apiFetch<{ ok: boolean; subjects: Subject[] }>(
      "/admin/subjects",
    );

    subjects = result.subjects;
  }

  async function loadQuestions() {
    loading = true;
    errorMessage = "";

    try {
      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (subjectId) params.set("subjectId", subjectId);
      if (difficultyLevel) params.set("difficultyLevel", difficultyLevel);
      if (weightPriority) params.set("weightPriority", weightPriority);

      const result = await apiFetch<{ ok: boolean; questions: Question[] }>(
        `/admin/questions?${params.toString()}`,
      );

      questions = result.questions;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat bank soal.";
    } finally {
      loading = false;
    }
  }

  async function deleteQuestion(id: string) {
    const confirmed = confirm("Hapus soal ini?");

    if (!confirmed) return;

    try {
      await apiFetch(`/admin/questions/${id}`, {
        method: "DELETE",
      });

      await loadQuestions();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus soal.";
    }
  }

  function difficultyLabel(level: DifficultyLevel) {
    if (level === "LOW") return "Mudah";
    if (level === "MEDIUM") return "Sedang";
    return "Sulit";
  }

  function difficultyClass(level: DifficultyLevel) {
    if (level === "LOW") return "bg-emerald-50 text-emerald-700";
    if (level === "MEDIUM") return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-700";
  }

  function priorityLabel(priority: WeightPriority) {
    if (priority === "LOW") return "Rendah";
    if (priority === "NORMAL") return "Normal";
    if (priority === "HIGH") return "Tinggi";
    return "Sangat Tinggi";
  }

  onMount(async () => {
    await loadSubjects();
    await loadQuestions();
  });
</script>

<main class="p-8">
  <section class="mx-auto max-w-7xl">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Bank Soal</h1>
        <p class="mt-1 text-sm text-slate-500">
          Kelola soal, tingkat kesulitan otomatis, prioritas kemunculan, dan
          bobot WRS.
        </p>
      </div>

      <button
        type="button"
        onclick={() => goto("/admin/questions/new")}
        class="rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white"
      >
        Tambah Soal
      </button>
    </div>

    <div
      class="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div class="grid grid-cols-1 gap-3 md:grid-cols-5">
        <input
          type="text"
          bind:value={search}
          placeholder="Cari teks soal..."
          class="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700 md:col-span-2"
        />

        <select
          bind:value={subjectId}
          class="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">Semua mapel</option>
          {#each subjects as subject}
            <option value={subject.id}>{subject.name}</option>
          {/each}
        </select>

        <select
          bind:value={difficultyLevel}
          class="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">Semua kesulitan</option>
          <option value="LOW">Mudah</option>
          <option value="MEDIUM">Sedang</option>
          <option value="HIGH">Sulit</option>
        </select>

        <select
          bind:value={weightPriority}
          class="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">Semua prioritas</option>
          <option value="LOW">Rendah</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">Tinggi</option>
          <option value="VERY_HIGH">Sangat Tinggi</option>
        </select>
      </div>

      <button
        type="button"
        onclick={loadQuestions}
        class="mt-3 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
      >
        Terapkan Filter
      </button>
    </div>

    {#if errorMessage}
      <p class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        {errorMessage}
      </p>
    {/if}

    <div
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-3">Soal</th>
            <th class="px-4 py-3">Mapel</th>
            <th class="px-4 py-3">Kesulitan</th>
            <th class="px-4 py-3">Prioritas</th>
            <th class="px-4 py-3">Bobot</th>
            <th class="px-4 py-3">Jawaban</th>
            <th class="px-4 py-3">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {#if loading}
            <tr>
              <td colspan="7" class="px-4 py-6 text-center text-slate-500">
                Memuat data...
              </td>
            </tr>
          {:else if questions.length === 0}
            <tr>
              <td colspan="7" class="px-4 py-6 text-center text-slate-500">
                Belum ada soal.
              </td>
            </tr>
          {:else}
            {#each questions as question}
              <tr class="border-t border-slate-100">
                <td class="max-w-md px-4 py-3 text-slate-800">
                  {question.questionText}
                </td>

                <td class="px-4 py-3 text-slate-600">
                  {question.subject.name}
                </td>

                <td class="px-4 py-3">
                  <span
                    class={`rounded-full px-3 py-1 text-xs font-semibold ${difficultyClass(question.difficultyLevel)}`}
                  >
                    {difficultyLabel(question.difficultyLevel)}
                  </span>
                </td>

                <td class="px-4 py-3 text-slate-600">
                  {priorityLabel(question.weightPriority)}
                </td>

                <td class="px-4 py-3 font-semibold text-slate-800">
                  {question.weight}
                </td>

                <td class="px-4 py-3 font-semibold text-slate-800">
                  {question.correctAnswer}
                </td>

                <td class="px-4 py-3">
                  <div class="flex gap-2">
                    <button
                      type="button"
                      onclick={() =>
                        goto(`/admin/questions/${question.id}/edit`)}
                      class="rounded-lg border border-slate-300 px-3 py-1 text-slate-700"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onclick={() => deleteQuestion(question.id)}
                      class="rounded-lg border border-red-200 px-3 py-1 text-red-600"
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
  </section>
</main>
