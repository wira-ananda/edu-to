<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import {
    getAdminTryoutsCached,
    invalidateAdminTryoutsCache,
    readAdminTryoutsCache,
  } from "$lib/cache/admin-page-cache";
  import type {
    AdminTryoutItem,
    MutateTryoutResponse,
    TryoutStatus,
    UpdateTryoutStatusPayload,
  } from "$lib/types/admin";
  import {
    getMaxAttemptsLabel,
    getTryoutStatusBadgeClass,
    getTryoutStatusLabel,
    tryoutStatusOptions,
  } from "$lib/types/admin";

  let loading = $state(true);
  let refreshing = $state(false);
  let deletingId = $state("");
  let updatingStatusId = $state("");
  let errorMessage = $state("");
  let tryouts = $state<AdminTryoutItem[]>([]);

  function isValidEnrollmentCache(cachedTryouts: AdminTryoutItem[]) {
    return cachedTryouts.every(
      (tryout) =>
        "totalEnrollments" in tryout &&
        "totalParticipants" in tryout &&
        "pendingRequests" in tryout &&
        "rejectedParticipants" in tryout,
    );
  }

  function getOwnerLabel(tryout: AdminTryoutItem) {
    if (!tryout.owner) {
      return "Tanpa owner";
    }

    if (tryout.owner.role === "ADMIN") {
      return `Admin: ${tryout.owner.name}`;
    }

    if (tryout.owner.role === "TEACHER") {
      return `Guru: ${tryout.owner.name}`;
    }

    return tryout.owner.name;
  }

  async function loadTryouts(options: { force?: boolean } = {}) {
    const force = options.force ?? false;

    errorMessage = "";

    const cachedTryouts = !force ? readAdminTryoutsCache() : null;

    if (cachedTryouts && isValidEnrollmentCache(cachedTryouts)) {
      tryouts = cachedTryouts;
      loading = false;
      return;
    }

    loading = tryouts.length === 0;

    try {
      tryouts = await getAdminTryoutsCached({ force: true });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat tryout.";
    } finally {
      loading = false;
    }
  }

  async function refreshTryouts() {
    refreshing = true;
    invalidateAdminTryoutsCache();

    try {
      await loadTryouts({ force: true });
    } finally {
      refreshing = false;
    }
  }

  async function updateTryoutStatus(
    tryoutId: string,
    nextStatus: TryoutStatus,
  ) {
    const currentTryout = tryouts.find((tryout) => tryout.id === tryoutId);

    if (!currentTryout || currentTryout.status === nextStatus) return;

    updatingStatusId = tryoutId;
    errorMessage = "";

    const previousTryouts = tryouts;

    tryouts = tryouts.map((tryout) => {
      if (tryout.id !== tryoutId) return tryout;

      return {
        ...tryout,
        status: nextStatus,
      };
    });

    try {
      const payload: UpdateTryoutStatusPayload = {
        status: nextStatus,
      };

      await apiFetch<MutateTryoutResponse>(
        `/admin/tryouts/${tryoutId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      invalidateAdminTryoutsCache();

      await loadTryouts({ force: true });
    } catch (error) {
      tryouts = previousTryouts;

      errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal memperbarui status tryout.";
    } finally {
      updatingStatusId = "";
    }
  }

  async function deleteTryout(id: string) {
    const confirmed = confirm("Hapus tryout ini?");

    if (!confirmed) return;

    deletingId = id;
    errorMessage = "";

    try {
      await apiFetch(`/admin/tryouts/${id}`, {
        method: "DELETE",
      });

      invalidateAdminTryoutsCache();

      await loadTryouts({ force: true });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus tryout.";
    } finally {
      deletingId = "";
    }
  }

  function handleStatusChange(tryoutId: string, event: Event) {
    const select = event.currentTarget as HTMLSelectElement;

    void updateTryoutStatus(tryoutId, select.value as TryoutStatus);
  }

  onMount(() => {
    void loadTryouts();
  });
</script>

<section class="space-y-5">
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <h2 class="text-2xl font-bold text-slate-950">Daftar Tryout</h2>

      <p class="mt-1 text-sm text-slate-500">
        Kelola paket tryout yang akan dikerjakan siswa.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        onclick={refreshTryouts}
        disabled={loading || refreshing}
        class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"
      >
        {refreshing ? "Memuat..." : "Refresh"}
      </button>

      <button
        type="button"
        onclick={() => goto("/admin/tryouts/new")}
        class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white"
      >
        + Buat Tryout
      </button>
    </div>
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
    <div class="overflow-x-auto">
      <table class="w-full min-w-[1240px] text-left text-sm">
        <thead
          class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"
        >
          <tr>
            <th class="px-5 py-4">Judul Tryout</th>
            <th class="px-5 py-4">Bank Soal</th>
            <th class="px-5 py-4">Jumlah Soal</th>
            <th class="px-5 py-4">Durasi</th>
            <th class="px-5 py-4">Percobaan</th>
            <th class="px-5 py-4">Status</th>
            <th class="px-5 py-4">Peserta</th>
            <th class="px-5 py-4">Sesi</th>
            <th class="px-5 py-4">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {#if loading}
            <tr>
              <td colspan="9" class="px-5 py-10 text-center text-slate-500">
                Memuat data...
              </td>
            </tr>
          {:else if tryouts.length === 0}
            <tr>
              <td colspan="9" class="px-5 py-10 text-center text-slate-500">
                Belum ada tryout.
              </td>
            </tr>
          {:else}
            {#each tryouts as tryout}
              <tr class="border-t border-slate-100">
                <td class="px-5 py-4">
                  <p class="font-bold text-slate-900">{tryout.title}</p>

                  <p class="mt-1 text-xs font-semibold text-slate-500">
                    {getOwnerLabel(tryout)}
                  </p>

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
                  {getMaxAttemptsLabel(tryout.maxAttempts)}
                </td>

                <td class="px-5 py-4">
                  <div class="flex flex-col gap-2">
                    <span
                      class={`w-fit rounded-full px-3 py-1 text-xs font-bold ${getTryoutStatusBadgeClass(
                        tryout.status,
                      )}`}
                    >
                      {getTryoutStatusLabel(tryout.status)}
                    </span>

                    <select
                      value={tryout.status}
                      disabled={updatingStatusId === tryout.id}
                      onchange={(event) => handleStatusChange(tryout.id, event)}
                      class="w-32 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {#each tryoutStatusOptions as option}
                        <option value={option.value}>{option.label}</option>
                      {/each}
                    </select>
                  </div>
                </td>

                <td class="px-5 py-4">
                  <p class="font-bold text-slate-900">
                    {tryout.totalParticipants}
                    <span class="text-xs font-semibold text-slate-400">
                      approved
                    </span>
                  </p>

                  <p class="text-xs font-semibold text-amber-700">
                    Pending: {tryout.pendingRequests}
                  </p>

                  <p class="text-xs font-semibold text-red-600">
                    Ditolak: {tryout.rejectedParticipants}
                  </p>
                </td>

                <td class="px-5 py-4 font-semibold text-slate-700">
                  {tryout.totalSessions}
                </td>

                <td class="px-5 py-4">
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onclick={() =>
                        goto(`/admin/tryouts/${tryout.id}/participants`)}
                      class="rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-700"
                    >
                      Peserta
                    </button>

                    <button
                      type="button"
                      onclick={() =>
                        goto(`/admin/results?tryoutId=${tryout.id}`)}
                      class="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-semibold text-blue-700"
                    >
                      Hasil
                    </button>

                    <button
                      type="button"
                      onclick={() => goto(`/admin/tryouts/${tryout.id}/edit`)}
                      class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === tryout.id}
                      onclick={() => deleteTryout(tryout.id)}
                      class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 disabled:opacity-50"
                    >
                      {deletingId === tryout.id ? "Menghapus..." : "Hapus"}
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</section>
