<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type {
    AnalyzeResult,
    AnswerOption,
    DifficultyLevel,
    Question,
    Subject,
    WeightPriority,
  } from "$lib/types/questions";

  const id = page.params.id;

  let subjects = $state<Subject[]>([]);
  let subjectId = $state("");
  let questionText = $state("");
  let optionA = $state("");
  let optionB = $state("");
  let optionC = $state("");
  let optionD = $state("");
  let correctAnswer = $state<AnswerOption>("A");
  let weightPriority = $state<WeightPriority>("NORMAL");

  let analyzeResult = $state<AnalyzeResult | null>(null);
  let loading = $state(true);
  let saving = $state(false);
  let analyzing = $state(false);
  let errorMessage = $state("");

  async function loadSubjects() {
    const result = await apiFetch<{ ok: boolean; subjects: Subject[] }>(
      "/admin/subjects",
    );

    subjects = result.subjects;
  }

  async function loadQuestion() {
    const result = await apiFetch<{ ok: boolean; question: Question }>(
      `/admin/questions/${id}`,
    );

    const question = result.question;

    subjectId = question.subjectId;
    questionText = question.questionText;
    optionA = question.optionA;
    optionB = question.optionB;
    optionC = question.optionC;
    optionD = question.optionD;
    correctAnswer = question.correctAnswer;
    weightPriority = question.weightPriority;

    analyzeResult = {
      difficultyLevel: question.difficultyLevel,
      difficultyScore: question.difficultyScore,
      detectedIndicators: question.detectedIndicators,
      weightPriority: question.weightPriority,
      weight: question.weight,
    };
  }

  function getWeight(priority: WeightPriority) {
    if (priority === "LOW") return 1;
    if (priority === "NORMAL") return 3;
    if (priority === "HIGH") return 5;
    return 7;
  }

  async function analyzeQuestion() {
    errorMessage = "";
    analyzing = true;

    try {
      const result = await apiFetch<{ ok: boolean; result: AnalyzeResult }>(
        "/admin/questions/analyze",
        {
          method: "POST",
          body: JSON.stringify({
            questionText,
            weightPriority,
          }),
        },
      );

      analyzeResult = result.result;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menganalisis soal.";
    } finally {
      analyzing = false;
    }
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    saving = true;
    errorMessage = "";

    try {
      await apiFetch(`/admin/questions/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          subjectId,
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer,
          weightPriority,
        }),
      });

      await goto("/admin/questions");
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memperbarui soal.";
    } finally {
      saving = false;
    }
  }

  function difficultyLabel(level: DifficultyLevel) {
    if (level === "LOW") return "Mudah";
    if (level === "MEDIUM") return "Sedang";
    return "Sulit";
  }

  function priorityLabel(priority: WeightPriority) {
    if (priority === "LOW") return "Rendah";
    if (priority === "NORMAL") return "Normal";
    if (priority === "HIGH") return "Tinggi";
    return "Sangat Tinggi";
  }

  onMount(async () => {
    try {
      await loadSubjects();
      await loadQuestion();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat soal.";
    } finally {
      loading = false;
    }
  });
</script>

<main class="p-8">
  <section class="mx-auto max-w-5xl">
    <div class="mb-6">
      <button
        type="button"
        onclick={() => goto("/admin/questions")}
        class="mb-3 text-sm font-semibold text-blue-900"
      >
        ← Kembali
      </button>

      <h1 class="text-2xl font-bold text-slate-900">Edit Soal</h1>
      <p class="mt-1 text-sm text-slate-500">
        Sistem menghitung ulang tingkat kesulitan dan bobot saat soal
        diperbarui.
      </p>
    </div>

    {#if loading}
      <p class="rounded-lg bg-white p-6 text-slate-600">Memuat soal...</p>
    {:else}
      <form
        class="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        onsubmit={handleSubmit}
      >
        {#if errorMessage}
          <p class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </p>
        {/if}

        <div>
          <label for="subject" class="text-sm font-semibold text-slate-700">
            Mata Pelajaran
          </label>

          <select
            id="subject"
            bind:value={subjectId}
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {#each subjects as subject}
              <option value={subject.id}>{subject.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label
            for="questionText"
            class="text-sm font-semibold text-slate-700"
          >
            Teks Soal
          </label>

          <textarea
            id="questionText"
            bind:value={questionText}
            rows="5"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
          ></textarea>
        </div>

        <div>
          <label
            for="weightPriority"
            class="text-sm font-semibold text-slate-700"
          >
            Prioritas Kemunculan
          </label>

          <select
            id="weightPriority"
            bind:value={weightPriority}
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="LOW">Rendah</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">Tinggi</option>
            <option value="VERY_HIGH">Sangat Tinggi</option>
          </select>

          <p class="mt-2 text-sm text-slate-500">
            Bobot WRS saat ini:
            <span class="font-semibold text-slate-900"
              >{getWeight(weightPriority)}</span
            >
          </p>
        </div>

        <div>
          <button
            type="button"
            onclick={analyzeQuestion}
            disabled={analyzing}
            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {analyzing ? "Menganalisis..." : "Analisis Ulang"}
          </button>
        </div>

        {#if analyzeResult}
          <div class="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <h2 class="font-bold text-blue-950">Hasil Analisis Sistem</h2>

            <div class="mt-3 grid grid-cols-4 gap-3 text-sm">
              <div class="rounded-lg bg-white p-3">
                <p class="text-slate-500">Kesulitan</p>
                <p class="font-bold text-slate-900">
                  {difficultyLabel(analyzeResult.difficultyLevel)}
                </p>
              </div>

              <div class="rounded-lg bg-white p-3">
                <p class="text-slate-500">Skor Kesulitan</p>
                <p class="font-bold text-slate-900">
                  {analyzeResult.difficultyScore}
                </p>
              </div>

              <div class="rounded-lg bg-white p-3">
                <p class="text-slate-500">Prioritas</p>
                <p class="font-bold text-slate-900">
                  {priorityLabel(analyzeResult.weightPriority)}
                </p>
              </div>

              <div class="rounded-lg bg-white p-3">
                <p class="text-slate-500">Bobot WRS</p>
                <p class="font-bold text-slate-900">{analyzeResult.weight}</p>
              </div>
            </div>

            <div class="mt-3">
              <p class="text-sm font-semibold text-blue-950">
                Indikator terdeteksi:
              </p>

              <ul class="mt-2 list-disc pl-5 text-sm text-slate-700">
                {#each analyzeResult.detectedIndicators as indicator}
                  <li>{indicator}</li>
                {/each}
              </ul>
            </div>
          </div>
        {/if}

        <div class="grid gap-3">
          <input
            bind:value={optionA}
            placeholder="Option A"
            class="rounded-lg border border-slate-300 px-3 py-2"
          />

          <input
            bind:value={optionB}
            placeholder="Option B"
            class="rounded-lg border border-slate-300 px-3 py-2"
          />

          <input
            bind:value={optionC}
            placeholder="Option C"
            class="rounded-lg border border-slate-300 px-3 py-2"
          />

          <input
            bind:value={optionD}
            placeholder="Option D"
            class="rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            for="correctAnswer"
            class="text-sm font-semibold text-slate-700"
          >
            Kunci Jawaban
          </label>

          <select
            id="correctAnswer"
            bind:value={correctAnswer}
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            onclick={() => goto("/admin/questions")}
            class="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={saving}
            class="rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    {/if}
  </section>
</main>
