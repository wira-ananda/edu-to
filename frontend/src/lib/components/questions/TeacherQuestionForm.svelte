<script lang="ts">
  import { goto } from "$app/navigation";
  import { apiFetch } from "$lib/api";
  import { invalidateTeacherQuestionDataCaches } from "$lib/cache/teacher-page-cache";
  import {
    answerOptions,
    getDifficultyLabel,
    getWeightFromPriority,
    weightPriorityOptions,
  } from "$lib/types/questions";
  import type { AnswerOption, WeightPriority } from "$lib/types/questions";
  import type {
    TeacherAnalyzeQuestionResponse,
    TeacherMutateQuestionResponse,
    TeacherQuestionResponse,
    TeacherSubjectsResponse,
  } from "$lib/types/teacher";

  type Props = {
    mode: "create" | "edit";

    subjects: TeacherSubjectsResponse["subjects"];

    initialQuestion?: TeacherQuestionResponse["question"] | null;

    defaultSubjectId?: string;
  };

  let {
    mode,
    subjects,
    initialQuestion = null,
    defaultSubjectId = "",
  }: Props = $props();

  function resolveInitialSubjectId() {
    if (initialQuestion?.subjectId) {
      return initialQuestion.subjectId;
    }

    if (
      defaultSubjectId &&
      subjects.some((subject) => subject.id === defaultSubjectId)
    ) {
      return defaultSubjectId;
    }

    return subjects[0]?.id ?? "";
  }

  let subjectId = $state(resolveInitialSubjectId());

  let questionText = $state(initialQuestion?.questionText ?? "");

  let imageAltText = $state(initialQuestion?.imageAltText ?? "");
  let currentImageUrl = $state<string | null>(
    initialQuestion?.imageUrl ?? null,
  );

  let imageFile = $state<File | null>(null);
  let removeImage = $state(false);

  let optionA = $state(initialQuestion?.optionA ?? "");
  let optionB = $state(initialQuestion?.optionB ?? "");
  let optionC = $state(initialQuestion?.optionC ?? "");
  let optionD = $state(initialQuestion?.optionD ?? "");

  let correctAnswer = $state<AnswerOption>(
    initialQuestion?.correctAnswer ?? "A",
  );

  let weightPriority = $state<WeightPriority>(
    initialQuestion?.weightPriority ?? "NORMAL",
  );

  let analyzing = $state(false);
  let saving = $state(false);

  let errorMessage = $state("");

  let analyzeResult = $state<TeacherAnalyzeQuestionResponse["result"] | null>(
    null,
  );

  const hasImage = $derived(
    Boolean(imageFile || (currentImageUrl && !removeImage)),
  );

  const hasDuplicateOptions = $derived.by(() => {
    const options = [optionA, optionB, optionC, optionD]
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (options.length < 4) {
      return false;
    }

    return new Set(options).size !== options.length;
  });

  const formInvalid = $derived(
    !subjectId ||
      questionText.trim().length < 5 ||
      !optionA.trim() ||
      !optionB.trim() ||
      !optionC.trim() ||
      !optionD.trim() ||
      hasDuplicateOptions ||
      (hasImage && !imageAltText.trim()),
  );

  const title = $derived(mode === "create" ? "Tambah Soal" : "Edit Soal");

  const description = $derived(
    mode === "create"
      ? "Tambahkan soal baru ke bank soal yang dipilih."
      : "Perbarui isi dan pengaturan soal.",
  );

  const submitLabel = $derived(
    mode === "create" ? "Simpan Soal" : "Simpan Perubahan",
  );

  function markAnalysisDirty() {
    analyzeResult = null;
  }

  function handleImageChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;

    imageFile = input.files?.[0] ?? null;

    if (imageFile) {
      removeImage = false;
    }

    markAnalysisDirty();
  }

  function cancelSelectedImage() {
    imageFile = null;
    markAnalysisDirty();
  }

  function removeCurrentImage() {
    removeImage = true;
    imageFile = null;

    markAnalysisDirty();
  }

  async function analyzeQuestion() {
    errorMessage = "";

    if (questionText.trim().length < 5) {
      errorMessage = "Teks soal minimal 5 karakter.";
      return;
    }

    if (hasImage && !imageAltText.trim()) {
      errorMessage = "Alt text wajib diisi jika soal menggunakan gambar.";
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
            hasImage,
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

    if (formInvalid) {
      if (hasDuplicateOptions) {
        errorMessage = "Pilihan jawaban A, B, C, dan D tidak boleh sama.";
        return;
      }

      if (hasImage && !imageAltText.trim()) {
        errorMessage = "Alt text wajib diisi jika soal menggunakan gambar.";
        return;
      }

      errorMessage = "Lengkapi semua data soal terlebih dahulu.";

      return;
    }

    if (mode === "edit" && !initialQuestion?.id) {
      errorMessage = "ID soal tidak valid.";
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

      const endpoint =
        mode === "create"
          ? "/teacher/questions"
          : `/teacher/questions/${initialQuestion!.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const result = await apiFetch<TeacherMutateQuestionResponse>(endpoint, {
        method,
        body: formData,
      });

      invalidateTeacherQuestionDataCaches(result.question.id);

      await goto(`/teacher/questions?bank=${subjectId}`);
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : mode === "create"
            ? "Gagal menyimpan soal."
            : "Gagal memperbarui soal.";
    } finally {
      saving = false;
    }
  }

  function cancel() {
    void goto(
      subjectId ? `/teacher/questions?bank=${subjectId}` : "/teacher/questions",
    );
  }
</script>

<section class="space-y-5">
  <div>
    <button
      type="button"
      onclick={cancel}
      class="mb-3 inline-flex items-center gap-2 text-sm font-bold text-[#0c438c] transition hover:text-[#062b63]"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>

      Kembali ke Bank Soal
    </button>

    <div
      class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p
          class="text-xs font-black uppercase tracking-[0.16em] text-[#0c438c]"
        >
          Bank Soal
        </p>

        <h2 class="mt-1 text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h2>

        <p class="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {#if subjectId}
        {@const currentSubject = subjects.find(
          (subject) => subject.id === subjectId,
        )}

        {#if currentSubject}
          <div
            class="w-fit rounded-xl bg-[#062b63] px-4 py-2 text-xs font-bold text-white"
          >
            {currentSubject.name}
          </div>
        {/if}
      {/if}
    </div>
  </div>

  {#if errorMessage}
    <div
      class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </div>
  {/if}

  {#if subjects.length === 0}
    <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p class="font-bold text-amber-900">Belum ada bank soal</p>

      <p class="mt-1 text-sm text-amber-700">
        Buat bank soal terlebih dahulu sebelum menambahkan soal.
      </p>

      <button
        type="button"
        onclick={() => goto("/teacher/questions")}
        class="mt-4 rounded-xl bg-[#062b63] px-4 py-2.5 text-sm font-bold text-white"
      >
        Ke Bank Soal
      </button>
    </div>
  {:else}
    <form class="space-y-5" onsubmit={handleSubmit}>
      <!-- Bank -->
      <section
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div class="mb-5">
          <p
            class="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
          >
            01 · Bank Soal
          </p>

          <h3 class="mt-1 text-lg font-black text-slate-950">
            Tentukan bank soal
          </h3>
        </div>

        <div>
          <label for="subjectId" class="text-sm font-bold text-slate-700">
            Bank Soal
          </label>

          <select
            id="subjectId"
            bind:value={subjectId}
            disabled={saving}
            class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
          >
            {#each subjects as subject}
              <option value={subject.id}>
                {subject.name}
              </option>
            {/each}
          </select>
        </div>
      </section>

      <!-- Question -->
      <section
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div class="mb-5">
          <p
            class="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
          >
            02 · Konten
          </p>

          <h3 class="mt-1 text-lg font-black text-slate-950">
            Tulis pertanyaan
          </h3>

          <p class="mt-1 text-sm text-slate-500">
            Gunakan pertanyaan yang jelas dan tidak ambigu.
          </p>
        </div>

        <label for="questionText" class="text-sm font-bold text-slate-700">
          Teks Soal
        </label>

        <textarea
          id="questionText"
          bind:value={questionText}
          oninput={markAnalysisDirty}
          rows="6"
          disabled={saving}
          placeholder="Tuliskan pertanyaan di sini..."
          class="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
        ></textarea>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <label for="image" class="text-sm font-bold text-slate-700">
              Gambar
              <span class="font-medium text-slate-400"> · opsional </span>
            </label>

            <input
              id="image"
              type="file"
              accept="image/*"
              onchange={handleImageChange}
              disabled={saving}
              class="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[#062b63] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white disabled:opacity-60"
            />

            {#if imageFile}
              <div
                class="mt-2 flex items-center justify-between gap-3 rounded-xl bg-blue-50 px-3 py-2"
              >
                <p
                  class="min-w-0 truncate text-xs font-semibold text-[#0c438c]"
                >
                  {imageFile.name}
                </p>

                <button
                  type="button"
                  onclick={cancelSelectedImage}
                  disabled={saving}
                  class="shrink-0 text-xs font-bold text-red-600"
                >
                  Batalkan
                </button>
              </div>
            {/if}
          </div>

          <div>
            <label for="imageAltText" class="text-sm font-bold text-slate-700">
              Deskripsi Gambar

              {#if hasImage}
                <span class="text-red-500">*</span>
              {/if}
            </label>

            <input
              id="imageAltText"
              type="text"
              bind:value={imageAltText}
              oninput={markAnalysisDirty}
              disabled={saving}
              placeholder="Jelaskan isi gambar secara singkat"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            />

            <p class="mt-2 text-xs text-slate-400">
              Wajib diisi jika soal menggunakan gambar.
            </p>
          </div>
        </div>

        {#if currentImageUrl && !removeImage && !imageFile}
          <div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
              <img
                src={currentImageUrl}
                alt={imageAltText || "Gambar soal"}
                class="max-h-48 w-full rounded-xl border border-slate-200 bg-white object-contain sm:w-64"
              />

              <div>
                <p class="text-sm font-bold text-slate-900">Gambar saat ini</p>

                <p class="mt-1 text-xs leading-5 text-slate-500">
                  Unggah gambar baru untuk mengganti gambar ini, atau hapus jika
                  soal tidak lagi membutuhkannya.
                </p>

                <button
                  type="button"
                  onclick={removeCurrentImage}
                  disabled={saving}
                  class="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  Hapus Gambar
                </button>
              </div>
            </div>
          </div>
        {/if}

        {#if removeImage && !imageFile}
          <div
            class="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700"
          >
            Gambar lama akan dihapus saat perubahan disimpan.
          </div>
        {/if}
      </section>

      <!-- Options -->
      <section
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div class="mb-5">
          <p
            class="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
          >
            03 · Pilihan Jawaban
          </p>

          <h3 class="mt-1 text-lg font-black text-slate-950">
            Isi empat pilihan jawaban
          </h3>

          <p class="mt-1 text-sm text-slate-500">
            Pastikan setiap pilihan memiliki jawaban yang berbeda.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label
              for="optionA"
              class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
            >
              <span
                class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#062b63] text-xs font-black text-white"
              >
                A
              </span>

              Pilihan A
            </label>

            <input
              id="optionA"
              type="text"
              bind:value={optionA}
              disabled={saving}
              placeholder="Isi pilihan A"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              for="optionB"
              class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
            >
              <span
                class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#062b63] text-xs font-black text-white"
              >
                B
              </span>

              Pilihan B
            </label>

            <input
              id="optionB"
              type="text"
              bind:value={optionB}
              disabled={saving}
              placeholder="Isi pilihan B"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              for="optionC"
              class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
            >
              <span
                class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#062b63] text-xs font-black text-white"
              >
                C
              </span>

              Pilihan C
            </label>

            <input
              id="optionC"
              type="text"
              bind:value={optionC}
              disabled={saving}
              placeholder="Isi pilihan C"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label
              for="optionD"
              class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
            >
              <span
                class="flex h-7 w-7 items-center justify-center rounded-lg bg-[#062b63] text-xs font-black text-white"
              >
                D
              </span>

              Pilihan D
            </label>

            <input
              id="optionD"
              type="text"
              bind:value={optionD}
              disabled={saving}
              placeholder="Isi pilihan D"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>
        </div>

        {#if hasDuplicateOptions}
          <p
            class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600"
          >
            Pilihan jawaban tidak boleh memiliki isi yang sama.
          </p>
        {/if}
      </section>

      <!-- Configuration -->
      <section
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div class="mb-5">
          <p
            class="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
          >
            04 · Pengaturan
          </p>

          <h3 class="mt-1 text-lg font-black text-slate-950">
            Atur jawaban dan prioritas
          </h3>
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
              class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            >
              {#each answerOptions as option}
                <option value={option}>
                  Pilihan {option}
                </option>
              {/each}
            </select>
          </div>

          <div>
            <label
              for="weightPriority"
              class="text-sm font-bold text-slate-700"
            >
              Prioritas Kemunculan
            </label>

            <select
              id="weightPriority"
              bind:value={weightPriority}
              onchange={markAnalysisDirty}
              disabled={saving}
              class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            >
              {#each weightPriorityOptions as option}
                <option value={option.value}>
                  {option.label} · Bobot {option.weight}
                </option>
              {/each}
            </select>

            <p class="mt-2 text-xs text-slate-400">
              Bobot WRS:
              <span class="font-bold text-slate-600">
                {getWeightFromPriority(weightPriority)}
              </span>
            </p>
          </div>
        </div>
      </section>

      <!-- Analysis -->
      <section
        class="relative overflow-hidden rounded-2xl bg-[#062b63] p-5 text-white shadow-sm sm:p-6"
      >
        <div
          class="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rotate-12 rounded-[40px] bg-[#0c438c]"
        ></div>

        <div
          class="pointer-events-none absolute right-0 top-0 h-full w-16 bg-[#f8c900]"
          style="clip-path: polygon(100% 0, 100% 100%, 45% 100%, 90% 0);"
        ></div>

        <div
          class="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p
              class="text-xs font-black uppercase tracking-[0.16em] text-blue-200"
            >
              Analisis Otomatis
            </p>

            <h3 class="mt-1 text-lg font-black">Analisis tingkat kesulitan</h3>

            <p class="mt-1 max-w-xl text-sm text-blue-100/75">
              Sistem membaca teks dan indikator soal untuk menentukan tingkat
              kesulitan.
            </p>
          </div>

          <button
            type="button"
            onclick={analyzeQuestion}
            disabled={analyzing || questionText.trim().length < 5}
            class="w-fit shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#062b63] transition hover:bg-blue-50 disabled:opacity-50"
          >
            {analyzing ? "Menganalisis..." : "Analisis Soal"}
          </button>
        </div>

        {#if analyzeResult}
          <div class="relative z-10 mt-5 grid gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-white/10 bg-white/10 p-4">
              <p
                class="text-[10px] font-bold uppercase tracking-wide text-blue-200"
              >
                Difficulty
              </p>

              <p class="mt-1 text-lg font-black">
                {getDifficultyLabel(analyzeResult.difficultyLevel)}
              </p>
            </div>

            <div class="rounded-xl border border-white/10 bg-white/10 p-4">
              <p
                class="text-[10px] font-bold uppercase tracking-wide text-blue-200"
              >
                Difficulty Score
              </p>

              <p class="mt-1 text-lg font-black">
                {analyzeResult.difficultyScore}
              </p>
            </div>

            <div class="rounded-xl border border-white/10 bg-white/10 p-4">
              <p
                class="text-[10px] font-bold uppercase tracking-wide text-blue-200"
              >
                Weight
              </p>

              <p class="mt-1 text-lg font-black text-[#f8c900]">
                {analyzeResult.weight}
              </p>
            </div>
          </div>
        {/if}
      </section>

      <!-- Actions -->
      <div
        class="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:justify-end"
      >
        <button
          type="button"
          onclick={cancel}
          disabled={saving}
          class="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={saving || formInvalid}
          class="relative overflow-hidden rounded-xl bg-[#062b63] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0c438c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span class="relative z-10">
            {saving ? "Menyimpan..." : submitLabel}
          </span>

          <span class="absolute bottom-0 left-0 h-1 w-full bg-[#f8c900]"></span>
        </button>
      </div>
    </form>
  {/if}
</section>
