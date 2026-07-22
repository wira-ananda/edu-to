<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import {
    answerOptions,
    getDifficultyLabel,
    getWeightFromPriority,
    weightPriorityOptions,
  } from "$lib/types/questions";
  import type {
    TeacherAnalyzeQuestionResponse,
    TeacherMutateQuestionResponse,
    TeacherQuestionResponse,
    TeacherSubjectsResponse,
  } from "$lib/types/teacher";
  import type { AnswerOption, WeightPriority } from "$lib/types/questions";

  const id = $derived(page.params.id ?? "");

  let subjects = $state<TeacherSubjectsResponse["subjects"]>([]);
  let subjectId = $state("");
  let questionText = $state("");
  let imageAltText = $state("");
  let imageUrl = $state<string | null>(null);
  let removeImage = $state(false);
  let imageFile = $state<File | null>(null);

  let optionA = $state("");
  let optionB = $state("");
  let optionC = $state("");
  let optionD = $state("");
  let correctAnswer = $state<AnswerOption>("A");
  let weightPriority = $state<WeightPriority>("NORMAL");

  let loading = $state(true);
  let analyzing = $state(false);
  let saving = $state(false);
  let errorMessage = $state("");
  let analyzeResult = $state<TeacherAnalyzeQuestionResponse["result"] | null>(
    null,
  );

  const formInvalid = $derived(
    !subjectId ||
      questionText.trim().length < 5 ||
      !optionA.trim() ||
      !optionB.trim() ||
      !optionC.trim() ||
      !optionD.trim(),
  );

  async function loadData() {
    if (!id) {
      throw new Error("ID soal tidak valid.");
    }

    const [subjectsResult, questionResult] = await Promise.all([
      apiFetch<TeacherSubjectsResponse>("/teacher/subjects"),
      apiFetch<TeacherQuestionResponse>(`/teacher/questions/${id}`),
    ]);

    subjects = subjectsResult.subjects;

    const question = questionResult.question;

    subjectId = question.subjectId;
    questionText = question.questionText;
    imageAltText = question.imageAltText ?? "";
    imageUrl = question.imageUrl;
    optionA = question.optionA;
    optionB = question.optionB;
    optionC = question.optionC;
    optionD = question.optionD;
    correctAnswer = question.correctAnswer;
    weightPriority = question.weightPriority;
  }

  function handleImageChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    imageFile = input.files?.[0] ?? null;

    if (imageFile) {
      removeImage = false;
    }
  }

  async function analyzeQuestion() {
    errorMessage = "";

    if (questionText.trim().length < 5) {
      errorMessage = "Teks soal minimal 5 karakter.";
      return;
    }

    analyzing = true;

    try {
      const result = await apiFetch<TeacherAnalyzeQuestionResponse>(
        "/teacher/questions/analyze",
        {
          method: "POST",
          body: JSON.stringify({
            questionText: questionText.trim(),
            imageAltText: imageAltText.trim() || null,
            hasImage: Boolean(imageFile || (imageUrl && !removeImage)),
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

    errorMessage = "";

    if (!id) {
      errorMessage = "ID soal tidak valid.";
      return;
    }

    if (formInvalid) {
      errorMessage = "Lengkapi data soal terlebih dahulu.";
      return;
    }

    saving = true;

    try {
      const formData = new FormData();

      formData.set("subjectId", subjectId);
      formData.set("questionText", questionText.trim());
      formData.set("imageAltText", imageAltText.trim());
      formData.set("optionA", optionA.trim());
      formData.set("optionB", optionB.trim());
      formData.set("optionC", optionC.trim());
      formData.set("optionD", optionD.trim());
      formData.set("correctAnswer", correctAnswer);
      formData.set("weightPriority", weightPriority);
      formData.set("removeImage", removeImage ? "true" : "false");

      if (imageFile) {
        formData.set("image", imageFile);
      }

      await apiFetch<TeacherMutateQuestionResponse>(
        `/teacher/questions/${id}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      await goto("/teacher/questions");
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memperbarui soal.";
    } finally {
      saving = false;
    }
  }

  onMount(async () => {
    loading = true;
    errorMessage = "";

    try {
      await loadData();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat data soal.";
    } finally {
      loading = false;
    }
  });
</script>

<section class="space-y-5">
  <div>
    <button
      type="button"
      onclick={() => goto("/teacher/questions")}
      class="mb-3 text-sm font-bold text-blue-900"
    >
      ← Kembali ke Bank Soal
    </button>

    <h2 class="text-2xl font-bold text-slate-950">Edit Soal</h2>

    <p class="mt-1 text-sm text-slate-500">Ubah soal milik akun guru ini.</p>
  </div>

  {#if loading}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-500">Memuat soal...</p>
    </div>
  {:else}
    <form
      class="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      onsubmit={handleSubmit}
    >
      {#if errorMessage}
        <p
          class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
        >
          {errorMessage}
        </p>
      {/if}

      <div>
        <label for="subjectId" class="text-sm font-bold text-slate-700">
          Bank Soal
        </label>

        <select
          id="subjectId"
          bind:value={subjectId}
          disabled={saving}
          class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
        >
          {#each subjects as subject}
            <option value={subject.id}>{subject.name}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="questionText" class="text-sm font-bold text-slate-700">
          Teks Soal
        </label>

        <textarea
          id="questionText"
          bind:value={questionText}
          rows="5"
          disabled={saving}
          class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
        ></textarea>
      </div>

      {#if imageUrl && !removeImage}
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-sm font-bold text-slate-700">Gambar Saat Ini</p>

          <img
            src={imageUrl}
            alt={imageAltText || "Gambar soal"}
            class="mt-3 max-h-64 rounded-xl border border-slate-200 bg-white object-contain"
          />

          <button
            type="button"
            onclick={() => {
              removeImage = true;
              imageFile = null;
            }}
            disabled={saving}
            class="mt-3 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-60"
          >
            Hapus Gambar
          </button>
        </div>
      {/if}

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label for="image" class="text-sm font-bold text-slate-700">
            Ganti Gambar Opsional
          </label>

          <input
            id="image"
            type="file"
            accept="image/*"
            onchange={handleImageChange}
            disabled={saving}
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label for="imageAltText" class="text-sm font-bold text-slate-700">
            Alt Text Gambar
          </label>

          <input
            id="imageAltText"
            type="text"
            bind:value={imageAltText}
            disabled={saving}
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
          />
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <input
          type="text"
          bind:value={optionA}
          placeholder="Opsi A"
          disabled={saving}
          class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
        />

        <input
          type="text"
          bind:value={optionB}
          placeholder="Opsi B"
          disabled={saving}
          class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
        />

        <input
          type="text"
          bind:value={optionC}
          placeholder="Opsi C"
          disabled={saving}
          class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
        />

        <input
          type="text"
          bind:value={optionD}
          placeholder="Opsi D"
          disabled={saving}
          class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
        />
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label for="correctAnswer" class="text-sm font-bold text-slate-700">
            Jawaban Benar
          </label>

          <select
            id="correctAnswer"
            bind:value={correctAnswer}
            disabled={saving}
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
          >
            {#each answerOptions as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="weightPriority" class="text-sm font-bold text-slate-700">
            Prioritas Bobot
          </label>

          <select
            id="weightPriority"
            bind:value={weightPriority}
            disabled={saving}
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
          >
            {#each weightPriorityOptions as option}
              <option value={option.value}>
                {option.label} - bobot {option.weight}
              </option>
            {/each}
          </select>

          <p class="mt-2 text-xs text-slate-500">
            Bobot saat ini: {getWeightFromPriority(weightPriority)}
          </p>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-bold text-slate-900">Analisis Ulang</p>
            <p class="text-xs text-slate-500">
              Jalankan analisis jika teks soal atau gambar berubah.
            </p>
          </div>

          <button
            type="button"
            onclick={analyzeQuestion}
            disabled={analyzing || questionText.trim().length < 5}
            class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-60"
          >
            {analyzing ? "Menganalisis..." : "Analisis Soal"}
          </button>
        </div>

        {#if analyzeResult}
          <div class="mt-4 grid gap-3 md:grid-cols-3">
            <div class="rounded-xl bg-white p-3">
              <p class="text-xs font-bold text-slate-400">Difficulty</p>
              <p class="font-bold text-slate-950">
                {getDifficultyLabel(analyzeResult.difficultyLevel)}
              </p>
            </div>

            <div class="rounded-xl bg-white p-3">
              <p class="text-xs font-bold text-slate-400">Score</p>
              <p class="font-bold text-slate-950">
                {analyzeResult.difficultyScore}
              </p>
            </div>

            <div class="rounded-xl bg-white p-3">
              <p class="text-xs font-bold text-slate-400">Weight</p>
              <p class="font-bold text-slate-950">{analyzeResult.weight}</p>
            </div>
          </div>
        {/if}
      </div>

      <div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          onclick={() => goto("/teacher/questions")}
          disabled={saving}
          class="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={saving || formInvalid}
          class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  {/if}
</section>
