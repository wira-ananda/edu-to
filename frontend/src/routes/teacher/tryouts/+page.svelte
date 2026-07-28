<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import TryoutJoinCodeCard from "$lib/components/tryouts/TryoutJoinCodeCard.svelte";
  import {
    getTeacherTryoutsCached,
    invalidateTeacherTryoutDetailCache,
    invalidateTeacherTryoutRelatedCaches,
    invalidateTeacherTryoutsCache,
    readTeacherTryoutsCache,
  } from "$lib/cache/teacher-page-cache";
  import {
    getMaxAttemptsLabel,
    getTryoutStatusBadgeClass,
    getTryoutStatusLabel,
    tryoutStatusOptions,
  } from "$lib/types/admin";
  import type {
    TryoutStatus,
    UpdateTryoutStatusPayload,
  } from "$lib/types/admin";
  import type {
    TeacherMutateTryoutResponse,
    TeacherRegenerateTryoutJoinCodeResponse,
    TeacherTryoutItem,
  } from "$lib/types/teacher";

  let loading = $state(true);
  let refreshing = $state(false);

  let deletingId = $state("");
  let updatingStatusId = $state("");
  let regeneratingCodeId = $state("");

  let errorMessage = $state("");
  let successMessage = $state("");

  let tryouts = $state<TeacherTryoutItem[]>([]);

  function isValidTryoutCache(cachedTryouts: TeacherTryoutItem[]) {
    return cachedTryouts.every(
      (tryout) =>
        "totalEnrollments" in tryout &&
        "totalParticipants" in tryout &&
        "pendingRequests" in tryout &&
        "rejectedParticipants" in tryout &&
        "joinCode" in tryout &&
        "joinCodeEnabled" in tryout,
    );
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  async function loadTryouts(
    options: {
      force?: boolean;
    } = {},
  ) {
    const force = options.force ?? false;

    errorMessage = "";

    const cachedTryouts = !force ? readTeacherTryoutsCache() : null;

    if (cachedTryouts && isValidTryoutCache(cachedTryouts)) {
      tryouts = cachedTryouts;
      loading = false;
      return;
    }

    loading = tryouts.length === 0;

    try {
      tryouts = await getTeacherTryoutsCached({
        force: force || Boolean(cachedTryouts),
      });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat tryout.";
    } finally {
      loading = false;
    }
  }

  async function refreshTryouts() {
    refreshing = true;
    successMessage = "";

    invalidateTeacherTryoutsCache();

    try {
      await loadTryouts({
        force: true,
      });
    } finally {
      refreshing = false;
    }
  }

  async function updateTryoutStatus(
    tryoutId: string,
    nextStatus: TryoutStatus,
  ) {
    const currentTryout = tryouts.find((tryout) => tryout.id === tryoutId);

    if (!currentTryout || currentTryout.status === nextStatus) {
      return;
    }

    updatingStatusId = tryoutId;

    errorMessage = "";
    successMessage = "";

    const previousTryouts = tryouts;

    tryouts = tryouts.map((tryout) =>
      tryout.id === tryoutId
        ? {
            ...tryout,
            status: nextStatus,
          }
        : tryout,
    );

    try {
      const payload: UpdateTryoutStatusPayload = {
        status: nextStatus,
      };

      const result = await apiFetch<TeacherMutateTryoutResponse>(
        `/teacher/tryouts/${tryoutId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      successMessage = result.message;

      invalidateTeacherTryoutsCache();
      invalidateTeacherTryoutDetailCache(tryoutId);

      await loadTryouts({
        force: true,
      });
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

  async function regenerateJoinCode(tryoutId: string) {
    const confirmed = confirm(
      "Buat ulang kode tryout? Kode lama tidak dapat digunakan lagi.",
    );

    if (!confirmed) {
      return;
    }

    regeneratingCodeId = tryoutId;

    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<TeacherRegenerateTryoutJoinCodeResponse>(
        `/teacher/tryouts/${tryoutId}/join-code/regenerate`,
        {
          method: "PATCH",
        },
      );

      successMessage = result.message;

      invalidateTeacherTryoutsCache();
      invalidateTeacherTryoutDetailCache(tryoutId);

      await loadTryouts({
        force: true,
      });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal membuat ulang kode.";
    } finally {
      regeneratingCodeId = "";
    }
  }

  async function deleteTryout(id: string) {
    const confirmed = confirm("Hapus tryout ini?");

    if (!confirmed) {
      return;
    }

    deletingId = id;

    errorMessage = "";
    successMessage = "";

    try {
      await apiFetch(`/teacher/tryouts/${id}`, {
        method: "DELETE",
      });

      invalidateTeacherTryoutRelatedCaches(id);

      successMessage = "Tryout berhasil dihapus.";

      await loadTryouts({
        force: true,
      });
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

<section class="space-y-6">
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <p class="text-xs font-black uppercase tracking-[0.16em] text-[#0c438c]">
        Pembelajaran
      </p>

      <h2 class="mt-1 text-2xl font-black tracking-tight text-slate-950">
        Tryout
      </h2>

      <p class="mt-1 text-sm text-slate-500">
        Kelola paket tryout, akses siswa, peserta, dan hasil pengerjaan.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        onclick={refreshTryouts}
        disabled={loading || refreshing}
        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {refreshing ? "Memuat..." : "Refresh"}
      </button>

      <button
        type="button"
        onclick={() => goto("/teacher/tryouts/new")}
        class="relative overflow-hidden rounded-xl bg-[#062b63] px-5 py-2.5 text-sm font-bold text-white"
      >
        <span class="relative z-10"> + Buat Tryout </span>

        <span class="absolute bottom-0 left-0 h-1 w-full bg-[#f8c900]"></span>
      </button>
    </div>
  </div>

  {#if errorMessage}
    <div
      class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </div>
  {/if}

  {#if successMessage}
    <div
      class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
    >
      {successMessage}
    </div>
  {/if}

  {#if loading}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="flex items-center gap-3">
        <div
          class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0c438c]"
        ></div>

        <p class="text-sm font-semibold text-slate-500">Memuat tryout...</p>
      </div>
    </div>
  {:else if tryouts.length === 0}
    <div
      class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
    >
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0c438c]"
      >
        <svg
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M6 3h9l3 3v15H6V3Z" />
          <path d="M9 11h6" />
          <path d="M9 15h6" />
        </svg>
      </div>

      <h3 class="mt-4 text-lg font-black text-slate-950">Belum ada tryout</h3>

      <p class="mt-2 text-sm text-slate-500">
        Buat tryout pertama dari bank soal yang sudah tersedia.
      </p>

      <button
        type="button"
        onclick={() => goto("/teacher/tryouts/new")}
        class="mt-5 rounded-xl bg-[#062b63] px-5 py-2.5 text-sm font-bold text-white"
      >
        Buat Tryout
      </button>
    </div>
  {:else}
    <div class="grid gap-5 xl:grid-cols-2">
      {#each tryouts as tryout}
        <article
          class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div class="p-5 sm:p-6">
            <div
              class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class={`rounded-full px-3 py-1 text-xs font-bold ${getTryoutStatusBadgeClass(
                      tryout.status,
                    )}`}
                  >
                    {getTryoutStatusLabel(tryout.status)}
                  </span>

                  <span class="text-xs font-medium text-slate-400">
                    {formatDate(tryout.createdAt)}
                  </span>
                </div>

                <h3 class="mt-3 text-lg font-black leading-6 text-slate-950">
                  {tryout.title}
                </h3>

                <p class="mt-1 text-sm font-semibold text-[#0c438c]">
                  {tryout.bank.name}
                </p>

                <p class="mt-0.5 text-xs text-slate-400">
                  {tryout.bank.totalAvailableQuestions}
                  soal tersedia di bank
                </p>
              </div>

              <div class="w-full sm:w-36">
                <label
                  for={`status-${tryout.id}`}
                  class="text-[10px] font-black uppercase tracking-wide text-slate-400"
                >
                  Status
                </label>

                <select
                  id={`status-${tryout.id}`}
                  value={tryout.status}
                  disabled={updatingStatusId === tryout.id}
                  onchange={(event) => handleStatusChange(tryout.id, event)}
                  class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                >
                  {#each tryoutStatusOptions as option}
                    <option value={option.value}>
                      {option.label}
                    </option>
                  {/each}
                </select>
              </div>
            </div>

            <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div class="rounded-xl bg-slate-50 p-3">
                <p
                  class="text-[10px] font-black uppercase tracking-wide text-slate-400"
                >
                  Soal
                </p>

                <p class="mt-1 text-lg font-black text-slate-950">
                  {tryout.totalQuestions}
                </p>
              </div>

              <div class="rounded-xl bg-slate-50 p-3">
                <p
                  class="text-[10px] font-black uppercase tracking-wide text-slate-400"
                >
                  Durasi
                </p>

                <p class="mt-1 text-lg font-black text-slate-950">
                  {tryout.durationMinutes}
                  <span class="text-xs font-semibold text-slate-400">
                    mnt
                  </span>
                </p>
              </div>

              <div class="rounded-xl bg-slate-50 p-3">
                <p
                  class="text-[10px] font-black uppercase tracking-wide text-slate-400"
                >
                  Percobaan
                </p>

                <p class="mt-1 text-sm font-black text-slate-950">
                  {getMaxAttemptsLabel(tryout.maxAttempts)}
                </p>
              </div>

              <div class="rounded-xl bg-slate-50 p-3">
                <p
                  class="text-[10px] font-black uppercase tracking-wide text-slate-400"
                >
                  Sesi
                </p>

                <p class="mt-1 text-lg font-black text-[#0c438c]">
                  {tryout.totalSessions}
                </p>
              </div>
            </div>

            <div class="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
              <TryoutJoinCodeCard
                joinCode={tryout.joinCode}
                enabled={tryout.joinCodeEnabled}
                showRegenerate
                regenerating={regeneratingCodeId === tryout.id}
                onRegenerate={() => regenerateJoinCode(tryout.id)}
              />

              <div class="rounded-2xl border border-slate-200 bg-white p-4">
                <p
                  class="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400"
                >
                  Peserta
                </p>

                <div class="mt-3 flex items-end gap-2">
                  <p class="text-3xl font-black text-slate-950">
                    {tryout.totalParticipants}
                  </p>

                  <p class="pb-1 text-xs font-semibold text-slate-400">
                    disetujui
                  </p>
                </div>

                <div class="mt-3 flex flex-wrap gap-2">
                  <span
                    class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"
                  >
                    {tryout.pendingRequests}
                    menunggu
                  </span>

                  <span
                    class="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600"
                  >
                    {tryout.rejectedParticipants}
                    ditolak
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6"
          >
            <button
              type="button"
              onclick={() => goto(`/teacher/tryouts/${tryout.id}/participants`)}
              class="rounded-xl bg-[#062b63] px-4 py-2 text-xs font-bold text-white"
            >
              Kelola Peserta
            </button>

            <button
              type="button"
              onclick={() => goto(`/teacher/results?tryoutId=${tryout.id}`)}
              class="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-[#0c438c]"
            >
              Lihat Hasil
            </button>

            <button
              type="button"
              onclick={() => goto(`/teacher/tryouts/${tryout.id}/edit`)}
              class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700"
            >
              Edit
            </button>

            <button
              type="button"
              disabled={deletingId === tryout.id}
              onclick={() => deleteTryout(tryout.id)}
              class="ml-auto rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deletingId === tryout.id ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
