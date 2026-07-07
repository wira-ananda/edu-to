<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type { AdminTryoutItem, AdminTryoutsResponse } from "$lib/types/admin";

  let loading = $state(true);
  let errorMessage = $state("");
  let tryouts = $state<AdminTryoutItem[]>([]);

  async function loadTryouts() {
    loading = true;
    errorMessage = "";

    try {
      const result = await apiFetch<AdminTryoutsResponse>("/admin/tryouts");
      tryouts = result.tryouts;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat tryout.";
    } finally {
      loading = false;
    }
  }

  async function deleteTryout(id: string) {
    const confirmed = confirm("Hapus tryout ini?");

    if (!confirmed) return;

    try {
      await apiFetch(`/admin/tryouts/${id}`, {
        method: "DELETE",
      });

      await loadTryouts();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus tryout.";
    }
  }

  onMount(loadTryouts);
</script>

<section class="space-y-5">
  <div class="flex items-start justify-between">
    <div>
      <h2 class="text-2xl font-bold text-slate-950">Daftar Tryout</h2>
      <p class="mt-1 text-sm text-slate-500">
        Kelola paket tryout yang akan dikerjakan siswa.
      </p>
    </div>

    <button
      type="button"
      onclick={() => goto("/admin/tryouts/new")}
      class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white"
    >
      + Buat Tryout
    </button>
  </div>

  {#if errorMessage}
    <p
      class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </p>
  {/if}

  <div
    class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
  >
    <table class="w-full text-left text-sm">
      <thead
        class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"
      >
        <tr>
          <th class="px-5 py-4">Judul Tryout</th>
          <th class="px-5 py-4">Bank Soal</th>
          <th class="px-5 py-4">Jumlah Soal</th>
          <th class="px-5 py-4">Durasi</th>
          <th class="px-5 py-4">Sesi Siswa</th>
          <th class="px-5 py-4">Aksi</th>
        </tr>
      </thead>

      <tbody>
        {#if loading}
          <tr>
            <td colspan="6" class="px-5 py-10 text-center text-slate-500">
              Memuat data...
            </td>
          </tr>
        {:else if tryouts.length === 0}
          <tr>
            <td colspan="6" class="px-5 py-10 text-center text-slate-500">
              Belum ada tryout.
            </td>
          </tr>
        {:else}
          {#each tryouts as tryout}
            <tr class="border-t border-slate-100">
              <td class="px-5 py-4">
                <p class="font-bold text-slate-900">{tryout.title}</p>
                <p class="text-xs text-slate-400">
                  {new Date(tryout.createdAt).toLocaleString("id-ID")}
                </p>
              </td>

              <td class="px-5 py-4">
                <p class="font-semibold text-slate-700">{tryout.bank.name}</p>
                <p class="text-xs text-slate-400">
                  {tryout.bank.totalAvailableQuestions} soal tersedia
                </p>
              </td>

              <td class="px-5 py-4 font-bold text-slate-900">
                {tryout.totalQuestions}
              </td>

              <td class="px-5 py-4 font-semibold text-slate-700">
                {tryout.durationMinutes} menit
              </td>

              <td class="px-5 py-4 font-semibold text-slate-700">
                {tryout.totalSessions}
              </td>

              <td class="px-5 py-4">
                <div class="flex gap-2">
                  <button
                    type="button"
                    onclick={() => goto(`/admin/tryouts/${tryout.id}/edit`)}
                    class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onclick={() => deleteTryout(tryout.id)}
                    class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600"
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
