<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type { Subject } from "$lib/types/questions";
  import type {
    AdminTryoutResponse,
    MutateTryoutResponse,
    UpdateTryoutPayload,
  } from "$lib/types/admin";

  type TryoutSubject = Subject & {
    totalAvailableQuestions: number;
  };

  type TryoutSubjectsResponse = {
    ok: boolean;
    subjects: TryoutSubject[];
  };

  const id = $derived(page.params.id ?? "");

  let subjects = $state<TryoutSubject[]>([]);
  let subjectId = $state("");
  let title = $state("");
  let totalQuestions = $state(1);
  let durationMinutes = $state(45);

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
    if (!subjectId) {
      return "";
    }

    if (maximumQuestions === 0) {
      return "Bank soal ini belum memiliki soal.";
    }

    if (!Number.isInteger(totalQuestions)) {
      return "Jumlah soal harus berupa bilangan bulat.";
    }

    if (totalQuestions < 1) {
      return "Jumlah soal minimal 1.";
    }

    if (totalQuestions > maximumQuestions) {
      return `Jumlah soal tidak boleh melebihi ${maximumQuestions} soal yang tersedia.`;
    }

    return "";
  });

  const durationError = $derived.by(() => {
    if (!Number.isInteger(durationMinutes)) {
      return "Durasi harus berupa bilangan bulat.";
    }

    if (durationMinutes < 1) {
      return "Durasi minimal 1 menit.";
    }

    return "";
  });

  const formInvalid = $derived(
    !title.trim() ||
      !subjectId ||
      maximumQuestions === 0 ||
      Boolean(totalQuestionsError) ||
      Boolean(durationError),
  );

  async function loadPageData() {
    if (!id) {
      throw new Error("ID tryout tidak valid.");
    }

    const [subjectsResult, tryoutResult] = await Promise.all([
      apiFetch<TryoutSubjectsResponse>("/admin/subjects"),

      apiFetch<AdminTryoutResponse>(`/admin/tryouts/${id}`),
    ]);

    subjects = subjectsResult.subjects;

    subjectId = tryoutResult.tryout.subjectId;

    title = tryoutResult.tryout.title;

    totalQuestions = tryoutResult.tryout.totalQuestions;

    durationMinutes = tryoutResult.tryout.durationMinutes;
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

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    errorMessage = "";

    if (!id) {
      errorMessage = "ID tryout tidak valid.";
      return;
    }

    if (!title.trim()) {
      errorMessage = "Judul tryout wajib diisi.";
      return;
    }

    if (!selectedSubject) {
      errorMessage = "Bank soal wajib dipilih.";
      return;
    }

    if (maximumQuestions === 0) {
      errorMessage = "Bank soal yang dipilih belum memiliki soal.";
      return;
    }

    if (totalQuestionsError) {
      errorMessage = totalQuestionsError;
      return;
    }

    if (durationError) {
      errorMessage = durationError;
      return;
    }

    saving = true;

    try {
      const payload: UpdateTryoutPayload = {
        subjectId,
        title: title.trim(),
        totalQuestions,
        durationMinutes,
      };

      await apiFetch<MutateTryoutResponse>(`/admin/tryouts/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await goto("/admin/tryouts");
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memperbarui tryout.";
    } finally {
      saving = false;
    }
  }

  onMount(async () => {
    loading = true;
    errorMessage = "";

    try {
      await loadPageData();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat data tryout.";
    } finally {
      loading = false;
    }
  });
</script>

<section class="space-y-5">
  <div>
    <button
      type="button"
      onclick={() => goto("/admin/tryouts")}
      class="mb-3 text-sm font-bold text-blue-900"
    >
      ← Kembali ke Daftar Tryout
    </button>

    <h2 class="text-2xl font-bold text-slate-950">Edit Tryout</h2>

    <p class="mt-1 text-sm text-slate-500">Ubah konfigurasi paket tryout.</p>
  </div>

  {#if loading}
    <div
      class="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm"
    >
      Memuat data tryout...
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
          required
          disabled={saving}
          class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-900 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
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
          required
          class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-900 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value=""> Pilih bank soal </option>

          {#each subjects as subject}
            <option value={subject.id}>
              {subject.name}
              ({subject.totalAvailableQuestions}
              soal)
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
            aria-invalid={Boolean(totalQuestionsError)}
            class={`mt-1 w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
              totalQuestionsError
                ? "border-red-500 ring-2 ring-red-100 focus:border-red-500 focus:bg-white focus:ring-red-100"
                : "border-slate-200 focus:border-blue-900 focus:bg-white"
            }`}
          />

          {#if totalQuestionsError}
            <p class="mt-2 text-xs font-semibold text-red-600">
              {totalQuestionsError}
            </p>
          {:else if selectedSubject}
            <p class="mt-2 text-xs text-slate-500">
              Bank soal memiliki
              {maximumQuestions} soal. Jumlah maksimal tryout adalah
              {maximumQuestions} soal.
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
            aria-invalid={Boolean(durationError)}
            class={`mt-1 w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
              durationError
                ? "border-red-500 ring-2 ring-red-100 focus:border-red-500 focus:bg-white focus:ring-red-100"
                : "border-slate-200 focus:border-blue-900 focus:bg-white"
            }`}
          />

          {#if durationError}
            <p class="mt-2 text-xs font-semibold text-red-600">
              {durationError}
            </p>
          {/if}
        </div>
      </div>

      <div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          onclick={() => goto("/admin/tryouts")}
          disabled={saving}
          class="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={saving || formInvalid}
          class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  {/if}
</section>
