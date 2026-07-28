<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import {
    invalidateTeacherTryoutRelatedCaches,
    invalidateTeacherTryoutsCache,
  } from "$lib/cache/teacher-page-cache";
  import { getTryoutStatusLabel, tryoutStatusOptions } from "$lib/types/admin";
  import type { TryoutStatus } from "$lib/types/admin";
  import type {
    TeacherCreateTryoutPayload,
    TeacherMutateTryoutResponse,
    TeacherSubjectsResponse,
    TeacherTryoutResponse,
    TeacherUpdateTryoutPayload,
  } from "$lib/types/teacher";

  type MaxAttemptsMode = "LIMITED" | "UNLIMITED";

  type Props = {
    mode: "create" | "edit";
    subjects: TeacherSubjectsResponse["subjects"];
    initialTryout?: TeacherTryoutResponse["tryout"] | null;
    defaultSubjectId?: string;
  };

  let {
    mode,
    subjects,
    initialTryout = null,
    defaultSubjectId = "",
  }: Props = $props();

  /*
   * Jangan isi $state langsung dari props.
   * Local form state diinisialisasi saat component mount.
   */
  let initialized = $state(false);

  let subjectId = $state("");
  let title = $state("");
  let totalQuestions = $state(1);
  let durationMinutes = $state(45);

  let maxAttemptsMode = $state<MaxAttemptsMode>("LIMITED");
  let maxAttempts = $state(1);

  let status = $state<TryoutStatus>("OPEN");

  let saving = $state(false);
  let errorMessage = $state("");

  const selectedSubject = $derived(
    subjects.find((subject) => subject.id === subjectId) ?? null,
  );

  const maximumQuestions = $derived(
    selectedSubject?.totalAvailableQuestions ?? 0,
  );

  const availableSubjects = $derived(
    subjects.filter((subject) => subject.totalAvailableQuestions > 0),
  );

  const hasAvailableSubject = $derived(availableSubjects.length > 0);

  const totalQuestionsError = $derived.by(() => {
    if (!subjectId) {
      return "";
    }

    if (maximumQuestions === 0) {
      return "Bank soal ini belum memiliki soal.";
    }

    if (!Number.isInteger(totalQuestions)) {
      return "Jumlah soal harus bilangan bulat.";
    }

    if (totalQuestions < 1) {
      return "Jumlah soal minimal 1.";
    }

    if (totalQuestions > maximumQuestions) {
      return `Jumlah soal tidak boleh melebihi ${maximumQuestions} soal.`;
    }

    return "";
  });

  const durationError = $derived.by(() => {
    if (!Number.isInteger(durationMinutes)) {
      return "Durasi harus bilangan bulat.";
    }

    if (durationMinutes < 1) {
      return "Durasi minimal 1 menit.";
    }

    return "";
  });

  const maxAttemptsError = $derived.by(() => {
    if (maxAttemptsMode === "UNLIMITED") {
      return "";
    }

    if (!Number.isInteger(maxAttempts)) {
      return "Batas percobaan harus bilangan bulat.";
    }

    if (maxAttempts < 1) {
      return "Batas percobaan minimal 1 kali.";
    }

    return "";
  });

  const formInvalid = $derived(
    !initialized ||
      !title.trim() ||
      !subjectId ||
      maximumQuestions === 0 ||
      Boolean(totalQuestionsError) ||
      Boolean(durationError) ||
      Boolean(maxAttemptsError),
  );

  const pageTitle = $derived(mode === "create" ? "Buat Tryout" : "Edit Tryout");

  const pageDescription = $derived(
    mode === "create"
      ? "Buat paket tryout dari salah satu bank soal milikmu."
      : "Perbarui konfigurasi paket tryout milikmu.",
  );

  const submitLabel = $derived(
    mode === "create" ? "Buat Tryout" : "Simpan Perubahan",
  );

  function initializeCreateForm() {
    title = "";
    durationMinutes = 45;

    maxAttemptsMode = "LIMITED";
    maxAttempts = 1;
    status = "OPEN";

    /*
     * Jika datang dari Bank Soal dengan ?subjectId=...
     * prioritaskan subject tersebut SELAMA ada.
     */
    const defaultSubject = defaultSubjectId
      ? (subjects.find((subject) => subject.id === defaultSubjectId) ?? null)
      : null;

    /*
     * Kalau default subject tidak ada,
     * pilih bank pertama yang MEMILIKI soal.
     */
    const firstUsableSubject =
      subjects.find((subject) => subject.totalAvailableQuestions > 0) ?? null;

    const selectedInitialSubject =
      defaultSubject?.totalAvailableQuestions &&
      defaultSubject.totalAvailableQuestions > 0
        ? defaultSubject
        : firstUsableSubject;

    if (!selectedInitialSubject) {
      subjectId = "";
      totalQuestions = 1;
      return;
    }

    subjectId = selectedInitialSubject.id;
    totalQuestions = selectedInitialSubject.totalAvailableQuestions;
  }

  function initializeEditForm() {
    if (!initialTryout) {
      return;
    }

    subjectId = initialTryout.subjectId;
    title = initialTryout.title;
    totalQuestions = initialTryout.totalQuestions;
    durationMinutes = initialTryout.durationMinutes;
    status = initialTryout.status;

    if (initialTryout.maxAttempts === null) {
      maxAttemptsMode = "UNLIMITED";
      maxAttempts = 1;
    } else {
      maxAttemptsMode = "LIMITED";
      maxAttempts = initialTryout.maxAttempts;
    }
  }

  function initializeForm() {
    if (initialized) {
      return;
    }

    if (mode === "edit") {
      initializeEditForm();
    } else {
      initializeCreateForm();
    }

    initialized = true;
  }

  function handleSubjectChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;

    subjectId = select.value;
    errorMessage = "";

    const subject = subjects.find((item) => item.id === subjectId) ?? null;

    if (!subject) {
      totalQuestions = 1;
      return;
    }

    if (subject.totalAvailableQuestions === 0) {
      totalQuestions = 1;
      return;
    }

    /*
     * Saat user mengganti bank:
     * default gunakan seluruh soal yang tersedia.
     * User tetap bisa menguranginya.
     */
    totalQuestions = subject.totalAvailableQuestions;
  }

  function setMaxAttemptsMode(nextMode: MaxAttemptsMode) {
    maxAttemptsMode = nextMode;
    errorMessage = "";

    if (nextMode === "LIMITED" && maxAttempts < 1) {
      maxAttempts = 1;
    }
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    errorMessage = "";

    if (mode === "edit" && !initialTryout?.id) {
      errorMessage = "ID tryout tidak valid.";
      return;
    }

    if (formInvalid) {
      errorMessage =
        totalQuestionsError ||
        durationError ||
        maxAttemptsError ||
        "Lengkapi konfigurasi tryout terlebih dahulu.";

      return;
    }

    saving = true;

    try {
      const commonPayload = {
        subjectId,
        title: title.trim(),
        totalQuestions,
        durationMinutes,
        maxAttempts: maxAttemptsMode === "UNLIMITED" ? null : maxAttempts,
        status,
      };

      if (mode === "create") {
        const payload: TeacherCreateTryoutPayload = commonPayload;

        await apiFetch<TeacherMutateTryoutResponse>("/teacher/tryouts", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        invalidateTeacherTryoutsCache();
      } else {
        const payload: TeacherUpdateTryoutPayload = commonPayload;

        await apiFetch<TeacherMutateTryoutResponse>(
          `/teacher/tryouts/${initialTryout!.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );

        invalidateTeacherTryoutRelatedCaches(initialTryout!.id);
      }

      await goto("/teacher/tryouts");
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : mode === "create"
            ? "Gagal membuat tryout."
            : "Gagal memperbarui tryout.";
    } finally {
      saving = false;
    }
  }

  onMount(() => {
    initializeForm();
  });
</script>

<section class="space-y-5">
  <div>
    <button
      type="button"
      onclick={() => goto("/teacher/tryouts")}
      class="mb-3 inline-flex items-center gap-2 text-sm font-bold text-[#0c438c]"
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

      Kembali ke Tryout
    </button>

    <p class="text-xs font-black uppercase tracking-[0.16em] text-[#0c438c]">
      Manajemen Tryout
    </p>

    <h2 class="mt-1 text-2xl font-black tracking-tight text-slate-950">
      {pageTitle}
    </h2>

    <p class="mt-1 text-sm text-slate-500">
      {pageDescription}
    </p>
  </div>

  {#if errorMessage}
    <div
      class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </div>
  {/if}

  {#if subjects.length === 0}
    <div class="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <div class="flex items-start gap-4">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
        >
          !
        </div>

        <div>
          <h3 class="font-black text-amber-900">Belum ada bank soal</h3>

          <p class="mt-1 text-sm leading-6 text-amber-700">
            Kamu harus membuat bank soal terlebih dahulu sebelum membuat tryout.
          </p>

          <button
            type="button"
            onclick={() => goto("/teacher/questions")}
            class="mt-4 rounded-xl bg-[#062b63] px-4 py-2.5 text-sm font-bold text-white"
          >
            Buka Bank Soal
          </button>
        </div>
      </div>
    </div>
  {:else if mode === "create" && !hasAvailableSubject}
    <div class="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <div class="flex items-start gap-4">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg font-black text-amber-700"
        >
          0
        </div>

        <div>
          <h3 class="font-black text-amber-900">
            Semua bank soal masih kosong
          </h3>

          <p class="mt-1 max-w-2xl text-sm leading-6 text-amber-700">
            Tryout membutuhkan minimal satu soal. Tambahkan soal ke salah satu
            bank sebelum membuat tryout.
          </p>

          <button
            type="button"
            onclick={() => goto("/teacher/questions/new")}
            class="mt-4 rounded-xl bg-[#062b63] px-4 py-2.5 text-sm font-bold text-white"
          >
            + Tambah Soal
          </button>
        </div>
      </div>
    </div>
  {:else}
    <form class="space-y-5" onsubmit={handleSubmit}>
      <section
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div class="mb-5">
          <p
            class="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
          >
            01 · Identitas
          </p>

          <h3 class="mt-1 text-lg font-black text-slate-950">
            Informasi tryout
          </h3>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
          <div>
            <label for="title" class="text-sm font-bold text-slate-700">
              Judul Tryout
            </label>

            <input
              id="title"
              type="text"
              bind:value={title}
              disabled={saving}
              placeholder="Contoh: Tryout Matematika Paket 1"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label for="subjectId" class="text-sm font-bold text-slate-700">
              Bank Soal
            </label>

            <select
              id="subjectId"
              value={subjectId}
              onchange={handleSubjectChange}
              disabled={saving}
              class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            >
              {#if mode === "create"}
                <option value="" disabled> Pilih bank soal </option>
              {/if}

              {#each subjects as subject}
                <option
                  value={subject.id}
                  disabled={mode === "create" &&
                    subject.totalAvailableQuestions === 0}
                >
                  {subject.name} · {subject.totalAvailableQuestions} soal
                  {subject.totalAvailableQuestions === 0 ? " · Kosong" : ""}
                </option>
              {/each}
            </select>
          </div>
        </div>

        {#if selectedSubject}
          <div
            class={`mt-5 flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 ${
              maximumQuestions > 0
                ? "bg-blue-50"
                : "border border-amber-100 bg-amber-50"
            }`}
          >
            <div
              class={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-black ${
                maximumQuestions > 0
                  ? "bg-[#062b63] text-[#f8c900]"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {maximumQuestions}
            </div>

            <div>
              <p
                class={`text-sm font-bold ${
                  maximumQuestions > 0 ? "text-[#062b63]" : "text-amber-900"
                }`}
              >
                {selectedSubject.name}
              </p>

              <p
                class={`text-xs ${
                  maximumQuestions > 0 ? "text-blue-700/70" : "text-amber-700"
                }`}
              >
                {#if maximumQuestions > 0}
                  {maximumQuestions} soal tersedia untuk digunakan.
                {:else}
                  Bank soal ini belum memiliki soal.
                {/if}
              </p>
            </div>
          </div>
        {/if}
      </section>

      <section
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div class="mb-5">
          <p
            class="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
          >
            02 · Pengerjaan
          </p>

          <h3 class="mt-1 text-lg font-black text-slate-950">
            Atur pengerjaan siswa
          </h3>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div>
            <label
              for="totalQuestions"
              class="text-sm font-bold text-slate-700"
            >
              Jumlah Soal
            </label>

            <div class="relative mt-2">
              <input
                id="totalQuestions"
                type="number"
                min="1"
                max={maximumQuestions > 0 ? maximumQuestions : undefined}
                step="1"
                bind:value={totalQuestions}
                disabled={saving || !subjectId || maximumQuestions === 0}
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-16 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <span
                class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400"
              >
                soal
              </span>
            </div>

            {#if totalQuestionsError}
              <p class="mt-2 text-xs font-semibold text-red-600">
                {totalQuestionsError}
              </p>
            {:else if maximumQuestions > 0}
              <p class="mt-2 text-xs text-slate-400">
                Maksimal {maximumQuestions} soal.
              </p>
            {/if}
          </div>

          <div>
            <label
              for="durationMinutes"
              class="text-sm font-bold text-slate-700"
            >
              Durasi
            </label>

            <div class="relative mt-2">
              <input
                id="durationMinutes"
                type="number"
                min="1"
                step="1"
                bind:value={durationMinutes}
                disabled={saving}
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              />

              <span
                class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400"
              >
                menit
              </span>
            </div>

            {#if durationError}
              <p class="mt-2 text-xs font-semibold text-red-600">
                {durationError}
              </p>
            {/if}
          </div>
        </div>
      </section>

      <section
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div class="mb-5">
          <p
            class="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
          >
            03 · Akses
          </p>

          <h3 class="mt-1 text-lg font-black text-slate-950">
            Percobaan dan status
          </h3>
        </div>

        <div>
          <p class="text-sm font-bold text-slate-700">Batas Percobaan</p>

          <div class="mt-2 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={saving}
              onclick={() => setMaxAttemptsMode("LIMITED")}
              class={`rounded-xl border p-4 text-left transition ${
                maxAttemptsMode === "LIMITED"
                  ? "border-[#0c438c] bg-blue-50 ring-1 ring-[#0c438c]"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <p class="font-bold text-slate-900">Dibatasi</p>

              <p class="mt-1 text-xs leading-5 text-slate-500">
                Siswa hanya dapat mencoba sesuai jumlah percobaan yang
                ditentukan.
              </p>
            </button>

            <button
              type="button"
              disabled={saving}
              onclick={() => setMaxAttemptsMode("UNLIMITED")}
              class={`rounded-xl border p-4 text-left transition ${
                maxAttemptsMode === "UNLIMITED"
                  ? "border-[#0c438c] bg-blue-50 ring-1 ring-[#0c438c]"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <p class="font-bold text-slate-900">Tanpa Batas</p>

              <p class="mt-1 text-xs leading-5 text-slate-500">
                Siswa dapat mencoba kembali selama tryout masih dibuka.
              </p>
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label for="maxAttempts" class="text-sm font-bold text-slate-700">
              Maksimal Percobaan
            </label>

            <div class="relative mt-2">
              <input
                id="maxAttempts"
                type="number"
                min="1"
                step="1"
                bind:value={maxAttempts}
                disabled={saving || maxAttemptsMode === "UNLIMITED"}
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-16 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <span
                class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400"
              >
                kali
              </span>
            </div>

            {#if maxAttemptsError}
              <p class="mt-2 text-xs font-semibold text-red-600">
                {maxAttemptsError}
              </p>
            {/if}
          </div>

          <div>
            <label for="status" class="text-sm font-bold text-slate-700">
              Status Tryout
            </label>

            <select
              id="status"
              bind:value={status}
              disabled={saving}
              class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            >
              {#each tryoutStatusOptions as option}
                <option value={option.value}>
                  {option.label}
                </option>
              {/each}
            </select>

            <p class="mt-2 text-xs text-slate-400">
              Status saat ini:
              <span class="font-bold text-slate-600">
                {getTryoutStatusLabel(status)}
              </span>
            </p>
          </div>
        </div>
      </section>

      <div
        class="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:justify-end"
      >
        <button
          type="button"
          onclick={() => goto("/teacher/tryouts")}
          disabled={saving}
          class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
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
