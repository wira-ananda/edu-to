<script lang="ts">
  import { goto } from "$app/navigation";

  import TryoutJoinCodeCard from "./TryoutJoinCodeCard.svelte";

  import {
    getMaxAttemptsLabel,
    getTryoutStatusBadgeClass,
    getTryoutStatusLabel,
    tryoutStatusOptions,
  } from "$lib/types/admin";

  import type { TryoutStatus } from "$lib/types/admin";
  import type { TryoutManagementItem } from "$lib/types/tryout-management";

  type Props = {
    tryouts: TryoutManagementItem[];

    loading?: boolean;
    refreshing?: boolean;

    deletingId?: string;
    updatingStatusId?: string;
    regeneratingCodeId?: string;

    errorMessage?: string;
    successMessage?: string;

    title?: string;
    eyebrow?: string;
    description?: string;

    createHref: string;

    getParticipantsHref: (tryoutId: string) => string;
    getResultsHref: (tryoutId: string) => string;
    getEditHref: (tryoutId: string) => string;

    showOwner?: boolean;

    onRefresh: () => void | Promise<void>;

    onStatusChange: (
      tryoutId: string,
      status: TryoutStatus,
    ) => void | Promise<void>;

    onRegenerateCode: (tryoutId: string) => void | Promise<void>;

    onDelete: (tryoutId: string) => void | Promise<void>;
  };

  let {
    tryouts,
    loading = false,
    refreshing = false,
    deletingId = "",
    updatingStatusId = "",
    regeneratingCodeId = "",
    errorMessage = "",
    successMessage = "",
    title = "Tryout",
    eyebrow = "Pembelajaran",
    description = "Kelola paket tryout, akses siswa, peserta, dan hasil pengerjaan.",
    createHref,
    getParticipantsHref,
    getResultsHref,
    getEditHref,
    showOwner = false,
    onRefresh,
    onStatusChange,
    onRegenerateCode,
    onDelete,
  }: Props = $props();

  function formatDate(value: string) {
    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function getOwnerLabel(tryout: TryoutManagementItem) {
    if (!tryout.owner) {
      return "";
    }

    if (tryout.owner.role === "ADMIN") {
      return `Admin: ${tryout.owner.name}`;
    }

    if (tryout.owner.role === "TEACHER") {
      return `Guru: ${tryout.owner.name}`;
    }

    return tryout.owner.name;
  }

  function handleStatusChange(tryoutId: string, event: Event) {
    const select = event.currentTarget as HTMLSelectElement;

    void onStatusChange(tryoutId, select.value as TryoutStatus);
  }
</script>

<section class="space-y-6">
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <p class="text-xs font-black uppercase tracking-[0.16em] text-[#0c438c]">
        {eyebrow}
      </p>

      <h2 class="mt-1 text-2xl font-black tracking-tight text-slate-950">
        {title}
      </h2>

      <p class="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        onclick={() => onRefresh()}
        disabled={loading || refreshing}
        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {refreshing ? "Memuat..." : "Refresh"}
      </button>

      <button
        type="button"
        onclick={() => goto(createHref)}
        class="relative overflow-hidden rounded-xl bg-[#062b63] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#052759]"
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
        onclick={() => goto(createHref)}
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
              <div class="min-w-0 flex-1">
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

                {#if showOwner && tryout.owner}
                  <p class="mt-1 text-xs font-semibold text-slate-500">
                    {getOwnerLabel(tryout)}
                  </p>
                {/if}

                <p class="mt-2 text-sm font-semibold text-[#0c438c]">
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
                  class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none transition focus:border-[#0c438c] disabled:cursor-not-allowed disabled:opacity-60"
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
                onRegenerate={() => onRegenerateCode(tryout.id)}
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
              onclick={() => goto(getParticipantsHref(tryout.id))}
              class="rounded-xl bg-[#062b63] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#052759]"
            >
              Kelola Peserta
            </button>

            <button
              type="button"
              onclick={() => goto(getResultsHref(tryout.id))}
              class="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-[#0c438c] transition hover:bg-blue-50"
            >
              Lihat Hasil
            </button>

            <button
              type="button"
              onclick={() => goto(getEditHref(tryout.id))}
              class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Edit
            </button>

            <button
              type="button"
              disabled={deletingId === tryout.id}
              onclick={() => onDelete(tryout.id)}
              class="ml-auto rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deletingId === tryout.id ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
