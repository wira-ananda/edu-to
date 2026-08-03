<script lang="ts">
  import TryoutJoinCodeCard from "./TryoutJoinCodeCard.svelte";
  import TryoutParticipantCard from "./TryoutParticipantCard.svelte";

  import type {
    EnrollmentStatus,
    TryoutParticipantItem,
    TryoutStatus,
  } from "$lib/types/admin";

  import {
    getMaxAttemptsLabel,
    getTryoutStatusBadgeClass,
    getTryoutStatusLabel,
  } from "$lib/types/admin";

  type TryoutData = {
    id: string;
    title: string;
    status: TryoutStatus;
    maxAttempts: number | null;
    joinCode: string | null;
    joinCodeEnabled: boolean;
  };

  type SummaryData = {
    totalEnrollments: number;
    totalParticipants: number;
    pendingRequests: number;
    rejectedParticipants: number;
  };

  type Props = {
    tryout: TryoutData | null;
    summary: SummaryData | null;
    participants: TryoutParticipantItem[];

    loading?: boolean;
    refreshing?: boolean;
    enrolling?: boolean;
    mutatingEnrollmentId?: string;

    errorMessage?: string;
    successMessage?: string;

    backHref: string;
    resultsHref: string;
    comparisonHref?: string;

    title?: string;
    description?: string;

    onRefresh: () => void | Promise<void>;
    onEnrollStudent: (studentId: string) => Promise<boolean>;
    onApprove: (enrollmentId: string) => void | Promise<void>;
    onReject: (enrollmentId: string) => void | Promise<void>;
  };

  let {
    tryout,
    summary,
    participants,

    loading = false,
    refreshing = false,
    enrolling = false,
    mutatingEnrollmentId = "",

    errorMessage = "",
    successMessage = "",

    backHref,
    resultsHref,
    comparisonHref = "",

    title = "Peserta Tryout",
    description = "Kelola permintaan bergabung dan pantau aktivitas peserta.",

    onRefresh,
    onEnrollStudent,
    onApprove,
    onReject,
  }: Props = $props();

  let studentId = $state("");
  let statusFilter = $state<"ALL" | EnrollmentStatus>("ALL");

  const filteredParticipants = $derived(
    statusFilter === "ALL"
      ? participants
      : participants.filter(
          (participant) => participant.status === statusFilter,
        ),
  );

  const filters: {
    value: "ALL" | EnrollmentStatus;
    label: string;
  }[] = [
    {
      value: "ALL",
      label: "Semua",
    },
    {
      value: "PENDING",
      label: "Menunggu",
    },
    {
      value: "APPROVED",
      label: "Disetujui",
    },
    {
      value: "REJECTED",
      label: "Ditolak",
    },
  ];

  async function handleEnroll(event: SubmitEvent) {
    event.preventDefault();

    const cleanedStudentId = studentId.trim();

    if (!cleanedStudentId || enrolling) {
      return;
    }

    const success = await onEnrollStudent(cleanedStudentId);

    if (success) {
      studentId = "";
    }
  }
</script>

<section class="space-y-6">
  <!-- Page heading -->
  <div
    class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"
  >
    <div class="min-w-0">
      <a
        href={backHref}
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

        Kembali ke Tryout
      </a>

      <h2 class="text-2xl font-black tracking-tight text-slate-950">
        {title}
      </h2>

      <p class="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>

    <div
      class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end"
    >
      {#if comparisonHref}
        <a
          href={comparisonHref}
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-black text-[#0c438c] transition hover:border-[#0c438c] hover:bg-white"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M4 19V5" />
            <path d="M9 19V9" />
            <path d="M14 19V7" />
            <path d="M19 19V3" />
          </svg>

          Bandingkan Soal
        </a>
      {/if}

      <button
        type="button"
        onclick={() => void onRefresh()}
        disabled={loading || refreshing}
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {#if refreshing}
          <span
            class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          ></span>
        {:else}
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 12a8 8 0 1 1-2.34-5.66" />
            <path d="M20 4v6h-6" />
          </svg>
        {/if}

        {refreshing ? "Memuat..." : "Refresh"}
      </button>

      <a
        href={resultsHref}
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#062b63] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#052757]"
      >
        <svg
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M8 21h8" />
          <path d="M12 17v4" />
          <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
          <path d="M5 4H3v2a4 4 0 0 0 4 4" />
          <path d="M19 4h2v2a4 4 0 0 1-4 4" />
        </svg>

        Lihat Hasil
      </a>
    </div>
  </div>

  <!-- Messages -->
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

        <p class="text-sm font-semibold text-slate-500">Memuat peserta...</p>
      </div>
    </div>
  {:else if !tryout || !summary}
    <div
      class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"
    >
      <p class="text-sm font-semibold text-slate-500">
        Data tryout tidak ditemukan.
      </p>
    </div>
  {:else}
    <!-- Tryout information -->
    <div class="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
      <div
        class="relative min-h-40 overflow-hidden rounded-2xl bg-[#062b63] p-5 text-white shadow-sm"
      >
        <div
          class="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rotate-12 rounded-[50px] bg-[#0c438c]"
        ></div>

        <div
          class="pointer-events-none absolute bottom-0 right-0 h-20 w-24 bg-[#f8c900]"
          style="clip-path: polygon(100% 0, 100% 100%, 0 100%);"
        ></div>

        <div class="relative z-10">
          <div class="flex flex-wrap gap-2">
            <span
              class={`rounded-full px-3 py-1 text-xs font-bold ${getTryoutStatusBadgeClass(
                tryout.status,
              )}`}
            >
              {getTryoutStatusLabel(tryout.status)}
            </span>

            <span
              class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-100"
            >
              {getMaxAttemptsLabel(tryout.maxAttempts)}
            </span>
          </div>

          <p
            class="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-200"
          >
            Tryout
          </p>

          <h3 class="mt-1 text-xl font-black">
            {tryout.title}
          </h3>
        </div>
      </div>

      <TryoutJoinCodeCard
        joinCode={tryout.joinCode}
        enabled={tryout.joinCodeEnabled}
      />
    </div>

    <!-- Summary -->
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p
          class="text-[10px] font-black uppercase tracking-wide text-slate-400"
        >
          Total Enrollment
        </p>

        <p class="mt-2 text-2xl font-black text-slate-950">
          {summary.totalEnrollments}
        </p>
      </div>

      <div class="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
        <p
          class="text-[10px] font-black uppercase tracking-wide text-emerald-600"
        >
          Disetujui
        </p>

        <p class="mt-2 text-2xl font-black text-emerald-700">
          {summary.totalParticipants}
        </p>
      </div>

      <div class="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
        <p
          class="text-[10px] font-black uppercase tracking-wide text-amber-600"
        >
          Menunggu
        </p>

        <p class="mt-2 text-2xl font-black text-amber-700">
          {summary.pendingRequests}
        </p>
      </div>

      <div class="rounded-2xl border border-red-100 bg-red-50/70 p-4">
        <p class="text-[10px] font-black uppercase tracking-wide text-red-500">
          Ditolak
        </p>

        <p class="mt-2 text-2xl font-black text-red-600">
          {summary.rejectedParticipants}
        </p>
      </div>
    </div>

    <!-- Manual enrollment -->
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h3 class="font-black text-slate-950">Tambah Peserta Manual</h3>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            Masukkan Student ID untuk menambahkan siswa secara langsung.
          </p>
        </div>

        <form
          onsubmit={handleEnroll}
          class="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl"
        >
          <input
            bind:value={studentId}
            disabled={enrolling}
            placeholder="Student ID"
            class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={enrolling || !studentId.trim()}
            class="rounded-xl bg-[#062b63] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#052757] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enrolling ? "Menambahkan..." : "Tambah Peserta"}
          </button>
        </form>
      </div>
    </div>

    <!-- Participants -->
    <section class="space-y-4">
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h3 class="text-lg font-black text-slate-950">Daftar Peserta</h3>

          <p class="mt-1 text-sm text-slate-500">
            {filteredParticipants.length}
            peserta ditampilkan.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          {#each filters as filter}
            <button
              type="button"
              onclick={() => (statusFilter = filter.value)}
              class={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                statusFilter === filter.value
                  ? "bg-[#062b63] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {filter.label}
            </button>
          {/each}
        </div>
      </div>

      {#if filteredParticipants.length === 0}
        <div
          class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"
        >
          <p class="text-sm font-semibold text-slate-500">
            Belum ada peserta dengan status ini.
          </p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each filteredParticipants as participant}
            <TryoutParticipantCard
              {participant}
              mutating={mutatingEnrollmentId === participant.id}
              {onApprove}
              {onReject}
            />
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</section>
