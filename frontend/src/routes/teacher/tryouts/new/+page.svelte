<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type { Subject } from "$lib/types/questions";
  import type {
    TeacherCreateTryoutPayload,
    TeacherMutateTryoutResponse,
  } from "$lib/types/teacher";
  import type { TryoutStatus } from "$lib/types/admin";
  import { tryoutStatusOptions } from "$lib/types/admin";

  type TryoutSubject = Subject & {
    totalAvailableQuestions: number;
  };

  type TryoutSubjectsResponse = {
    ok: boolean;
    subjects: TryoutSubject[];
  };

  type MaxAttemptsMode = "LIMITED" | "UNLIMITED";

  let subjects = $state<TryoutSubject[]>([]);
  let subjectId = $state("");
  let title = $state("");
  let totalQuestions = $state(1);
  let durationMinutes = $state(45);
  let maxAttemptsMode = $state<MaxAttemptsMode>("LIMITED");
  let maxAttempts = $state(1);
  let status = $state<TryoutStatus>("OPEN");

  let loading = $state(true);
  let saving = $state(false);
  let errorMessage = $state("");

  const selectedSubject = $derived(
    subjects.find((subject) => subject.id === subjectId) ?? null,
  );

  const maximumQuestions = $derived(
    selectedSubject?.totalAvailableQuestions ?? 0,
  );

  const totalQuestionsError = $derived.by(() => {
    if (!subjectId) return "";

    if (maximumQuestions === 0) return "Bank soal ini belum memiliki soal.";
    if (!Number.isInteger(totalQuestions))
      return "Jumlah soal harus bilangan bulat.";
    if (totalQuestions < 1) return "Jumlah soal minimal 1.";
    if (totalQuestions > maximumQuestions) {
      return `Jumlah soal tidak boleh melebihi ${maximumQuestions} soal.`;
    }

    return "";
  });

  const durationError = $derived.by(() => {
    if (!Number.isInteger(durationMinutes))
      return "Durasi harus bilangan bulat.";
    if (durationMinutes < 1) return "Durasi minimal 1 menit.";

    return "";
  });

  const maxAttemptsError = $derived.by(() => {
    if (maxAttemptsMode === "UNLIMITED") return "";
    if (!Number.isInteger(maxAttempts))
      return "Batas percobaan harus bilangan bulat.";
    if (maxAttempts < 1) return "Batas percobaan minimal 1 kali.";

    return "";
  });

  const formInvalid = $derived(
    !title.trim() ||
      !subjectId ||
      maximumQuestions === 0 ||
      Boolean(totalQuestionsError) ||
      Boolean(durationError) ||
      Boolean(maxAttemptsError),
  );

  async function loadSubjects() {
    const result = await apiFetch<TryoutSubjectsResponse>("/teacher/subjects");

    subjects = result.subjects;

    const firstSubject = subjects[0] ?? null;

    if (firstSubject) {
      subjectId = firstSubject.id;
      totalQuestions =
        firstSubject.totalAvailableQuestions > 0
          ? firstSubject.totalAvailableQuestions
          : 1;
    }
  }

  function handleSubjectChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;

    subjectId = select.value;

    const subject = subjects.find((item) => item.id === subjectId) ?? null;

    totalQuestions =
      subject && subject.totalAvailableQuestions > 0
        ? subject.totalAvailableQuestions
        : 1;

    errorMessage = "";
  }

  function handleMaxAttemptsModeChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;

    maxAttemptsMode = select.value as MaxAttemptsMode;

    if (maxAttemptsMode === "LIMITED" && maxAttempts < 1) {
      maxAttempts = 1;
    }

    errorMessage = "";
  }

  function handleStatusChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;

    status = select.value as TryoutStatus;
    errorMessage = "";
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    errorMessage = "";

    if (formInvalid) {
      errorMessage =
        totalQuestionsError ||
        durationError ||
        maxAttemptsError ||
        "Lengkapi data tryout.";
      return;
    }

    saving = true;

    try {
      const payload: TeacherCreateTryoutPayload = {
        subjectId,
        title: title.trim(),
        totalQuestions,
        durationMinutes,
        maxAttempts: maxAttemptsMode === "UNLIMITED" ? null : maxAttempts,
        status,
      };

      await apiFetch<TeacherMutateTryoutResponse>("/teacher/tryouts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await goto("/teacher/tryouts");
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal membuat tryout.";
    } finally {
      saving = false;
    }
  }

  onMount(async () => {
    loading = true;
    errorMessage = "";

    try {
      await loadSubjects();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat bank soal.";
    } finally {
      loading = false;
    }
  });
</script>

<section class="space-y-5">
  <div>
    <button
      type="button"
      onclick={() => goto("/teacher/tryouts")}
      class="mb-3 text-sm font-bold text-blue-900"
    >
      ← Kembali ke Daftar Tryout
    </button>

    <h2 class="text-2xl font-bold text-slate-950">Buat Tryout Guru</h2>

    <p class="mt-1 text-sm text-slate-500">
      Tryout ini akan memakai bank soal milik akun guru ini.
    </p>
  </div>

  {#if loading}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-500">Memuat bank soal...</p>
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
        <label for="title" class="text-sm font-bold text-slate-700">
          Judul Tryout
        </label>

        <input
          id="title"
          type="text"
          bind:value={title}
          disabled={saving}
          placeholder="Contoh: Tryout Matematika Paket 1"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
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
          class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
        >
          <option value="">Pilih bank soal</option>

          {#each subjects as subject}
            <option value={subject.id}>
              {subject.name} ({subject.totalAvailableQuestions} soal)
            </option>
          {/each}
        </select>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label for="totalQuestions" class="text-sm font-bold text-slate-700">
            Jumlah Soal
          </label>

          <input
            id="totalQuestions"
            type="number"
            min="1"
            max={maximumQuestions > 0 ? maximumQuestions : undefined}
            step="1"
            bind:value={totalQuestions}
            disabled={saving || !subjectId || maximumQuestions === 0}
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
          />

          {#if totalQuestionsError}
            <p class="mt-2 text-xs font-semibold text-red-600">
              {totalQuestionsError}
            </p>
          {:else if selectedSubject}
            <p class="mt-2 text-xs text-slate-500">
              Bank soal memiliki {maximumQuestions} soal.
            </p>
          {/if}
        </div>

        <div>
          <label for="durationMinutes" class="text-sm font-bold text-slate-700">
            Durasi Menit
          </label>

          <input
            id="durationMinutes"
            type="number"
            min="1"
            step="1"
            bind:value={durationMinutes}
            disabled={saving}
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
          />

          {#if durationError}
            <p class="mt-2 text-xs font-semibold text-red-600">
              {durationError}
            </p>
          {/if}
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label for="maxAttemptsMode" class="text-sm font-bold text-slate-700">
            Batas Percobaan
          </label>

          <select
            id="maxAttemptsMode"
            value={maxAttemptsMode}
            onchange={handleMaxAttemptsModeChange}
            disabled={saving}
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
          >
            <option value="LIMITED">Dibatasi</option>
            <option value="UNLIMITED">Tanpa batas sampai tryout ditutup</option>
          </select>
        </div>

        <div>
          <label for="maxAttempts" class="text-sm font-bold text-slate-700">
            Maksimal Percobaan
          </label>

          <input
            id="maxAttempts"
            type="number"
            min="1"
            step="1"
            bind:value={maxAttempts}
            disabled={saving || maxAttemptsMode === "UNLIMITED"}
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
          />

          {#if maxAttemptsError}
            <p class="mt-2 text-xs font-semibold text-red-600">
              {maxAttemptsError}
            </p>
          {/if}
        </div>
      </div>

      <div>
        <label for="status" class="text-sm font-bold text-slate-700">
          Status Tryout
        </label>

        <select
          id="status"
          value={status}
          onchange={handleStatusChange}
          disabled={saving}
          class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
        >
          {#each tryoutStatusOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          onclick={() => goto("/teacher/tryouts")}
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
          {saving ? "Menyimpan..." : "Simpan Tryout"}
        </button>
      </div>
    </form>
  {/if}
</section>
