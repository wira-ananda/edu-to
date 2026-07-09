<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import {
    getAdminQuestionBanksCached,
    invalidateAdminQuestionBanksCache,
    readAdminQuestionBanksCache,
  } from "$lib/cache/admin-page-cache";
  import type { QuestionBank } from "$lib/types/questions";

  type CreateSubjectResponse = {
    ok: boolean;
    subject: {
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    };
  };

  let loading = $state(true);
  let refreshing = $state(false);
  let creating = $state(false);
  let showCreateModal = $state(false);

  let errorMessage = $state("");
  let successMessage = $state("");
  let search = $state("");
  let newBankName = $state("");

  let banks = $state<QuestionBank[]>([]);

  const filteredBanks = $derived(
    banks.filter((bank) =>
      bank.name.toLowerCase().includes(search.trim().toLowerCase()),
    ),
  );

  async function loadBanks(options: { force?: boolean } = {}) {
    const force = options.force ?? false;

    errorMessage = "";

    const cachedBanks = !force ? readAdminQuestionBanksCache() : null;

    if (cachedBanks) {
      banks = cachedBanks;
      loading = false;
      return;
    }

    loading = banks.length === 0;

    try {
      banks = await getAdminQuestionBanksCached({ force });
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal memuat daftar bank soal.";
    } finally {
      loading = false;
    }
  }

  async function refreshBanks() {
    refreshing = true;
    successMessage = "";
    invalidateAdminQuestionBanksCache();

    try {
      await loadBanks({ force: true });
    } finally {
      refreshing = false;
    }
  }

  async function createBank(event: SubmitEvent) {
    event.preventDefault();

    errorMessage = "";
    successMessage = "";
    creating = true;

    try {
      const name = newBankName.trim();

      if (!name) {
        throw new Error("Nama bank soal wajib diisi.");
      }

      await apiFetch<CreateSubjectResponse>("/admin/subjects", {
        method: "POST",
        body: JSON.stringify({
          name,
        }),
      });

      successMessage = "Bank soal berhasil ditambahkan.";
      newBankName = "";
      showCreateModal = false;

      invalidateAdminQuestionBanksCache();

      await loadBanks({ force: true });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menambahkan bank soal.";
    } finally {
      creating = false;
    }
  }

  onMount(() => {
    void loadBanks();
  });
</script>

<section class="space-y-5">
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <h2 class="text-2xl font-bold text-slate-950">Bank Soal</h2>

      <p class="mt-1 text-sm text-slate-500">
        Pilih bank soal atau kategori evaluasi terlebih dahulu untuk melihat
        daftar soal.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        onclick={refreshBanks}
        disabled={loading || refreshing}
        class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"
      >
        {refreshing ? "Memuat..." : "Refresh"}
      </button>

      <button
        type="button"
        onclick={() => {
          showCreateModal = true;
          errorMessage = "";
          successMessage = "";
        }}
        class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white"
      >
        + Tambah Bank Soal
      </button>
    </div>
  </div>

  <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <input
      type="text"
      bind:value={search}
      placeholder="Cari bank soal, kategori, olimpiade, atau jenis tes..."
      class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
    />
  </div>

  {#if errorMessage}
    <p
      class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </p>
  {/if}

  {#if successMessage}
    <p
      class="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
    >
      {successMessage}
    </p>
  {/if}

  {#if loading}
    <div
      class="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm"
    >
      Memuat daftar bank soal...
    </div>
  {:else if filteredBanks.length === 0}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-600">
        Belum ada bank soal yang cocok.
      </p>

      <button
        type="button"
        onclick={() => {
          showCreateModal = true;
          newBankName = search.trim();
        }}
        class="mt-4 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white"
      >
        Tambah Bank Soal
      </button>
    </div>
  {:else}
    <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {#each filteredBanks as bank}
        <article
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p
                class="text-sm font-semibold uppercase tracking-wide text-slate-400"
              >
                Bank Soal
              </p>

              <h3 class="mt-1 text-xl font-bold text-slate-950">
                {bank.name}
              </h3>

              <p class="mt-1 text-sm text-slate-500">
                Kategori evaluasi atau kumpulan soal
              </p>
            </div>

            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900"
            >
              <svg
                class="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path
                  d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"
                />
                <path
                  d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21.5z"
                />
              </svg>
            </div>
          </div>

          <div class="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-500">Total Soal</p>

            <p class="mt-1 text-3xl font-bold text-slate-950">
              {bank.totalQuestions}
            </p>
          </div>

          <div class="mt-4 grid grid-cols-3 gap-3 text-center">
            <div class="rounded-xl bg-emerald-50 p-3">
              <p class="text-xs font-bold text-emerald-700">Mudah</p>

              <p class="mt-1 text-lg font-bold text-emerald-800">
                {bank.difficultyCounts.LOW}
              </p>
            </div>

            <div class="rounded-xl bg-amber-50 p-3">
              <p class="text-xs font-bold text-amber-700">Sedang</p>

              <p class="mt-1 text-lg font-bold text-amber-800">
                {bank.difficultyCounts.MEDIUM}
              </p>
            </div>

            <div class="rounded-xl bg-red-50 p-3">
              <p class="text-xs font-bold text-red-700">Sulit</p>

              <p class="mt-1 text-lg font-bold text-red-800">
                {bank.difficultyCounts.HIGH}
              </p>
            </div>
          </div>

          <div class="mt-5 flex gap-3">
            <button
              type="button"
              onclick={() => goto(`/admin/questions/${bank.id}`)}
              class="flex-1 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-bold text-white"
            >
              Buka Bank Soal
            </button>

            <button
              type="button"
              onclick={() => goto(`/admin/questions/new?subjectId=${bank.id}`)}
              class="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
            >
              Tambah Soal
            </button>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

{#if showCreateModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
  >
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-xl font-bold text-slate-950">Tambah Bank Soal</h3>

          <p class="mt-1 text-sm text-slate-500">
            Bank soal dapat digunakan untuk mata pelajaran, olimpiade, tryout,
            atau jenis tes lain.
          </p>
        </div>

        <button
          type="button"
          onclick={() => {
            showCreateModal = false;
            newBankName = "";
          }}
          class="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          ✕
        </button>
      </div>

      <form class="mt-5 space-y-4" onsubmit={createBank}>
        <div>
          <label for="bankName" class="text-sm font-bold text-slate-700">
            Nama Bank Soal
          </label>

          <input
            id="bankName"
            type="text"
            bind:value={newBankName}
            placeholder="Contoh: Biologi SMA, Olimpiade Biologi, Tes Logika"
            class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
          />
        </div>

        <div class="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <p class="font-semibold text-slate-800">Contoh penggunaan:</p>
          <p class="mt-1">
            Biologi SMA, Olimpiade Biologi, Tryout Semester, Tes Numerasi, Tes
            Logika.
          </p>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onclick={() => {
              showCreateModal = false;
              newBankName = "";
            }}
            class="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={creating}
            class="rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {creating ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
