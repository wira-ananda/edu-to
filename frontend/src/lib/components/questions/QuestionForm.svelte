<script lang="ts">
  import { goto } from "$app/navigation";

  import QuestionAnalysisCard from "./QuestionAnalysisCard.svelte";
  import QuestionConfigSection from "./QuestionConfigSection.svelte";
  import QuestionContentSection from "./QuestionContentSection.svelte";
  import QuestionOptionsSection from "./QuestionOptionsSection.svelte";

  import type {
    AnalyzeResult,
    AnswerOption,
    WeightPriority,
  } from "$lib/types/questions";

  import type {
    QuestionAnalyzeHandler,
    QuestionFormInitialValue,
    QuestionFormMode,
    QuestionFormPayload,
    QuestionFormSubject,
    QuestionSubmitHandler,
  } from "$lib/types/question-form";

  type Props = {
    mode: QuestionFormMode;
    subjects: QuestionFormSubject[];
    initialQuestion?: QuestionFormInitialValue | null;
    defaultSubjectId?: string;
    backHref: string;
    onAnalyze: QuestionAnalyzeHandler;
    onSubmit: QuestionSubmitHandler;
  };

  let {
    mode,
    subjects,
    initialQuestion = null,
    defaultSubjectId = "",
    backHref,
    onAnalyze,
    onSubmit,
  }: Props = $props();

  /*
   * ==========================================================
   * LOCAL FORM STATE
   * ==========================================================
   */

  let initializedKey = $state("");

  let subjectId = $state("");
  let questionText = $state("");
  let imageAltText = $state("");

  let imageFile = $state<File | null>(null);
  let removeImage = $state(false);
  let compressingImage = $state(false);

  let optionA = $state("");
  let optionB = $state("");
  let optionC = $state("");
  let optionD = $state("");

  let correctAnswer = $state<AnswerOption>("A");
  let weightPriority = $state<WeightPriority>("NORMAL");

  let analyzing = $state(false);
  let saving = $state(false);

  let errorMessage = $state("");

  let analyzeResult = $state<AnalyzeResult | null>(null);

  /*
   * ==========================================================
   * DERIVED STATE
   * ==========================================================
   */

  const currentSubject = $derived(
    subjects.find((subject) => subject.id === subjectId) ?? null,
  );

  const hasImage = $derived(
    Boolean(imageFile || (initialQuestion?.imageUrl && !removeImage)),
  );

  const hasDuplicateOptions = $derived.by(() => {
    const values = [optionA, optionB, optionC, optionD]
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (values.length < 4) {
      return false;
    }

    return new Set(values).size !== values.length;
  });

  const formInvalid = $derived(
    !initializedKey ||
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

  const cancelHref = $derived(
    subjectId ? `${backHref}?bank=${encodeURIComponent(subjectId)}` : backHref,
  );

  /*
   * ==========================================================
   * INITIALIZATION
   * ==========================================================
   */

  function resolveCreateSubjectId() {
    if (
      defaultSubjectId &&
      subjects.some((subject) => subject.id === defaultSubjectId)
    ) {
      return defaultSubjectId;
    }

    return subjects[0]?.id ?? "";
  }

  function initializeCreateForm() {
    subjectId = resolveCreateSubjectId();

    questionText = "";
    imageAltText = "";

    imageFile = null;
    removeImage = false;
    compressingImage = false;

    optionA = "";
    optionB = "";
    optionC = "";
    optionD = "";

    correctAnswer = "A";
    weightPriority = "NORMAL";

    analyzeResult = null;

    errorMessage = "";
  }

  function initializeEditForm(question: QuestionFormInitialValue) {
    subjectId = question.subjectId;

    questionText = question.questionText;

    imageAltText = question.imageAltText ?? "";

    imageFile = null;
    removeImage = false;
    compressingImage = false;

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

    errorMessage = "";
  }

  /*
   * Tunggu props siap.
   *
   * initializedKey mencegah form di-reset setiap ada
   * perubahan local state.
   */
  $effect(() => {
    if (mode === "edit") {
      if (!initialQuestion) {
        return;
      }

      const nextKey = `edit:${initialQuestion.id}`;

      if (initializedKey === nextKey) {
        return;
      }

      initializeEditForm(initialQuestion);

      initializedKey = nextKey;

      return;
    }

    if (subjects.length === 0) {
      return;
    }

    const nextKey = `create:${defaultSubjectId || "default"}`;

    if (initializedKey === nextKey) {
      return;
    }

    initializeCreateForm();

    initializedKey = nextKey;
  });

  /*
   * ==========================================================
   * EVENTS
   * ==========================================================
   */

  function markAnalysisDirty() {
    analyzeResult = null;
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
      analyzeResult = await onAnalyze({
        questionText: questionText.trim(),
        imageAltText: imageAltText.trim() || null,
        hasImage,
        weightPriority,
      });
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

    if (mode === "edit" && !initialQuestion?.id) {
      errorMessage = "ID soal tidak valid.";
      return;
    }

    if (formInvalid) {
      if (!subjectId) {
        errorMessage = "Bank soal wajib dipilih.";
        return;
      }

      if (questionText.trim().length < 5) {
        errorMessage = "Teks soal minimal 5 karakter.";
        return;
      }

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

    const payload: QuestionFormPayload = {
      subjectId,

      questionText: questionText.trim(),

      imageAltText: imageAltText.trim(),

      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),

      correctAnswer,

      weightPriority,

      imageFile,

      removeImage,
    };

    saving = true;

    try {
      await onSubmit(payload);
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
    void goto(cancelHref);
  }
</script>

<section class="space-y-5">
  <!-- HEADER -->
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

      {#if currentSubject}
        <div
          class="w-fit rounded-xl bg-[#062b63] px-4 py-2 text-xs font-bold text-white"
        >
          {currentSubject.name}
        </div>
      {/if}
    </div>
  </div>

  <!-- ERROR -->
  {#if errorMessage}
    <div
      class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </div>
  {/if}

  <!-- EMPTY SUBJECT -->
  {#if subjects.length === 0}
    <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p class="font-bold text-amber-900">Belum ada bank soal</p>

      <p class="mt-1 text-sm text-amber-700">
        Buat bank soal terlebih dahulu sebelum menambahkan soal.
      </p>

      <button
        type="button"
        onclick={() => goto(backHref)}
        class="mt-4 rounded-xl bg-[#062b63] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0c438c]"
      >
        Ke Bank Soal
      </button>
    </div>
  {:else}
    <form class="space-y-5" onsubmit={handleSubmit}>
      <!-- QUESTION CONTENT -->
      <QuestionContentSection
        {subjects}
        bind:subjectId
        bind:questionText
        bind:imageAltText
        bind:imageFile
        bind:removeImage
        bind:compressing={compressingImage}
        existingImageUrl={initialQuestion?.imageUrl ?? null}
        disabled={saving}
        onDirty={markAnalysisDirty}
      />

      <!-- ANSWER OPTIONS -->
      <QuestionOptionsSection
        bind:optionA
        bind:optionB
        bind:optionC
        bind:optionD
        {hasDuplicateOptions}
        disabled={saving}
      />

      <!-- CONFIGURATION -->
      <QuestionConfigSection
        bind:correctAnswer
        bind:weightPriority
        disabled={saving}
        onPriorityChange={markAnalysisDirty}
      />

      <!-- ANALYSIS -->
      <QuestionAnalysisCard
        result={analyzeResult}
        {analyzing}
        disabled={saving || questionText.trim().length < 5}
        onAnalyze={analyzeQuestion}
      />

      <!-- ACTIONS -->
      <div
        class="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:justify-end"
      >
        <button
          type="button"
          onclick={cancel}
          disabled={saving}
          class="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={saving || compressingImage || formInvalid}
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
