<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type { Subject, SubjectsResponse } from "$lib/types/questions";
  import type {
    AdminTryoutResponse,
    MutateTryoutResponse,
    UpdateTryoutPayload,
  } from "$lib/types/admin";

  const id = $derived(page.params.id);

  let subjects = $state<Subject[]>([]);
  let subjectId = $state("");
  let title = $state("");
  let totalQuestions = $state(30);
  let durationMinutes = $state(45);

  let loading = $state(true);
  let saving = $state(false);
  let errorMessage = $state("");

  async function loadSubjects() {
    const result = await apiFetch<SubjectsResponse>("/admin/subjects");
    subjects = result.subjects;
  }

  async function loadTryout() {
    const result = await apiFetch<AdminTryoutResponse>(`/admin/tryouts/${id}`);

    subjectId = result.tryout.subjectId;
    title = result.tryout.title;
    totalQuestions = result.tryout.totalQuestions;
    durationMinutes = result.tryout.durationMinutes;
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    saving = true;
    errorMessage = "";

    try {
      const payload: UpdateTryoutPayload = {
        subjectId,
        title,
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
    try {
      await loadSubjects();
      await loadTryout();
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
          class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
        />
      </div>

      <div>
        <label for="subjectId" class="text-sm font-bold text-slate-700">
          Bank Soal
        </label>

        <select
          id="subjectId"
          bind:value={subjectId}
          class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
        >
          <option value="">Pilih bank soal</option>

          {#each subjects as subject}
            <option value={subject.id}>{subject.name}</option>
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
            bind:value={totalQuestions}
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
          />
        </div>

        <div>
          <label for="durationMinutes" class="text-sm font-bold text-slate-700">
            Durasi Menit
          </label>

          <input
            id="durationMinutes"
            type="number"
            min="1"
            bind:value={durationMinutes}
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
          />
        </div>
      </div>

      <div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          onclick={() => goto("/admin/tryouts")}
          class="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={saving}
          class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  {/if}
</section>
