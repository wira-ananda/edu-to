<script lang="ts">
  import type { StudentTryoutItem } from "$lib/types/student";

  import {
    getEnrollmentStatusBadgeClass,
    getEnrollmentStatusLabel,
    getMaxAttemptsLabel,
  } from "$lib/types/admin";

  type Props = {
    tryout: StudentTryoutItem;
    starting?: boolean;
    requesting?: boolean;
    onAction: (tryout: StudentTryoutItem) => void | Promise<void>;
  };

  let {
    tryout,
    starting = false,
    requesting = false,
    onAction,
  }: Props = $props();

  const ownerLabel = $derived.by(() => {
    if (!tryout.owner) {
      return "Admin / Guru";
    }

    if (tryout.owner.role === "ADMIN") {
      return `Admin: ${tryout.owner.name}`;
    }

    if (tryout.owner.role === "TEACHER") {
      return `Guru: ${tryout.owner.name}`;
    }

    return tryout.owner.name;
  });

  const attemptsRemainingLabel = $derived.by(() => {
    if (tryout.maxAttempts === null) {
      return "Tanpa batas";
    }

    return `${tryout.attemptsRemaining ?? 0} tersisa`;
  });

  const enrollmentDescription = $derived.by(() => {
    if (tryout.enrollmentStatus === "APPROVED") {
      return "Kamu sudah terdaftar sebagai peserta.";
    }

    if (tryout.enrollmentStatus === "PENDING") {
      return "Permintaanmu sedang menunggu persetujuan.";
    }

    if (tryout.enrollmentStatus === "REJECTED") {
      return "Permintaan akses sebelumnya ditolak.";
    }

    return "Kamu belum menjadi peserta tryout ini.";
  });

  const disabledReason = $derived.by(() => {
    if (tryout.bank.totalAvailableQuestions < tryout.totalQuestions) {
      return "Soal pada bank belum mencukupi.";
    }

    if (tryout.enrollmentStatus !== "APPROVED") {
      if (tryout.enrollmentStatus === "PENDING") {
        return "Menunggu persetujuan admin atau guru.";
      }

      if (tryout.enrollmentStatus === "REJECTED") {
        return "Akses ke tryout ini ditolak.";
      }

      return "Minta akses terlebih dahulu.";
    }

    if (tryout.ongoingSessionId) {
      return "";
    }

    if (!tryout.canStart) {
      return "Batas percobaan untuk tryout ini sudah habis.";
    }

    return "";
  });

  const actionLabel = $derived.by(() => {
    if (tryout.canRequestJoin) {
      return "Minta Akses";
    }

    if (tryout.enrollmentStatus === "PENDING") {
      return "Menunggu Persetujuan";
    }

    if (tryout.enrollmentStatus === "REJECTED") {
      return "Akses Ditolak";
    }

    if (tryout.ongoingSessionId) {
      return "Lanjutkan Tryout";
    }

    return "Mulai Tryout";
  });

  const busy = $derived(starting || requesting);

  const actionDisabled = $derived(
    (Boolean(disabledReason) && !tryout.canRequestJoin) || busy,
  );

  const cardAccentClass = $derived.by(() => {
    if (tryout.ongoingSessionId) {
      return "bg-amber-400";
    }

    if (tryout.enrollmentStatus === "APPROVED") {
      return "bg-emerald-500";
    }

    if (tryout.enrollmentStatus === "PENDING") {
      return "bg-amber-400";
    }

    if (tryout.enrollmentStatus === "REJECTED") {
      return "bg-red-500";
    }

    return "bg-[#f8c900]";
  });

  const buttonClass = $derived.by(() => {
    if (tryout.ongoingSessionId) {
      return "bg-amber-500 text-white hover:bg-amber-600";
    }

    if (tryout.canRequestJoin) {
      return "bg-[#062b63] text-white hover:bg-[#0c438c]";
    }

    return "bg-[#173fa5] text-white hover:bg-[#0c438c]";
  });

  function handleAction() {
    if (actionDisabled) {
      return;
    }

    void onAction(tryout);
  }
</script>

<article
  class="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
>
  <div class={`h-1.5 w-full ${cardAccentClass}`}></div>

  <div class="flex flex-1 flex-col p-5 sm:p-6">
    <!-- Heading -->
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p
          class="text-[10px] font-black uppercase tracking-[0.16em] text-[#0c438c]"
        >
          Tryout
        </p>

        <h3
          class="mt-1 line-clamp-2 text-lg font-black leading-6 text-slate-950 sm:text-xl"
        >
          {tryout.title}
        </h3>
      </div>

      <span
        class="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700"
      >
        Dibuka
      </span>
    </div>

    <!-- Basic information -->
    <div class="mt-4 space-y-2">
      <div class="flex items-start gap-2">
        <svg
          class="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5" />
          <path
            d="M13 3h4.5A2.5 2.5 0 0 1 20 5.5v16A2.5 2.5 0 0 0 17.5 19H13V3Z"
          />
        </svg>

        <p class="min-w-0 text-sm text-slate-500">
          <span class="font-semibold">Bank:</span>
          <span class="font-bold text-slate-700">
            {tryout.bank.name}
          </span>
        </p>
      </div>

      <div class="flex items-start gap-2">
        <svg
          class="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21c.5-4 3-6 7-6s6.5 2 7 6" />
        </svg>

        <p class="min-w-0 text-sm text-slate-500">
          <span class="font-semibold">Oleh:</span>
          <span class="font-bold text-slate-700">{ownerLabel}</span>
        </p>
      </div>
    </div>

    <!-- Enrollment -->
    <div class="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p
          class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
        >
          Status Akses
        </p>

        <span
          class={`rounded-full px-2.5 py-1 text-[10px] font-black ${getEnrollmentStatusBadgeClass(
            tryout.enrollmentStatus,
          )}`}
        >
          {getEnrollmentStatusLabel(tryout.enrollmentStatus)}
        </span>
      </div>

      <p class="mt-2 text-xs font-semibold leading-5 text-slate-600">
        {enrollmentDescription}
      </p>
    </div>

    <!-- Metrics -->
    <div class="mt-4 grid grid-cols-2 gap-2.5">
      <div class="rounded-xl bg-slate-50 p-3.5">
        <p
          class="text-[10px] font-black uppercase tracking-wide text-slate-400"
        >
          Soal
        </p>

        <p class="mt-1 text-xl font-black text-slate-950">
          {tryout.totalQuestions}
        </p>
      </div>

      <div class="rounded-xl bg-slate-50 p-3.5">
        <p
          class="text-[10px] font-black uppercase tracking-wide text-slate-400"
        >
          Durasi
        </p>

        <p class="mt-1 text-xl font-black text-slate-950">
          {tryout.durationMinutes}
          <span class="text-xs font-bold text-slate-400">mnt</span>
        </p>
      </div>

      <div class="rounded-xl bg-slate-50 p-3.5">
        <p
          class="text-[10px] font-black uppercase tracking-wide text-slate-400"
        >
          Percobaan
        </p>

        <p class="mt-1 text-base font-black text-slate-950">
          {tryout.attemptsUsed}
          <span class="text-xs font-bold text-slate-400">terpakai</span>
        </p>
      </div>

      <div class="rounded-xl bg-slate-50 p-3.5">
        <p
          class="text-[10px] font-black uppercase tracking-wide text-slate-400"
        >
          Maksimal
        </p>

        <p class="mt-1 text-base font-black text-slate-950">
          {getMaxAttemptsLabel(tryout.maxAttempts)}
        </p>
      </div>
    </div>

    <!-- Remaining -->
    <div class="mt-3 flex items-center justify-between gap-3 text-xs">
      <span class="font-semibold text-slate-500"> Sisa percobaan </span>

      <span
        class={`font-black ${
          tryout.maxAttempts !== null && (tryout.attemptsRemaining ?? 0) === 0
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {attemptsRemainingLabel}
      </span>
    </div>

    {#if tryout.ongoingSessionId}
      <div
        class="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5"
      >
        <svg
          class="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="m10 8 6 4-6 4V8Z" />
        </svg>

        <p class="text-xs font-semibold leading-5 text-amber-700">
          Kamu memiliki sesi yang belum selesai.
        </p>
      </div>
    {:else if disabledReason && !tryout.canRequestJoin}
      <div
        class="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5"
      >
        <svg
          class="mt-0.5 h-4 w-4 shrink-0 text-red-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>

        <p class="text-xs font-semibold leading-5 text-red-600">
          {disabledReason}
        </p>
      </div>
    {/if}

    <!-- pushes action to bottom -->
    <div class="flex-1"></div>

    <button
      type="button"
      onclick={handleAction}
      disabled={actionDisabled}
      class={`mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 ${buttonClass}`}
    >
      {#if starting}
        <span
          class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        ></span>

        Memulai...
      {:else if requesting}
        <span
          class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        ></span>

        Mengirim...
      {:else}
        {#if tryout.ongoingSessionId}
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="m9 7 7 5-7 5V7Z" />
          </svg>
        {/if}

        {actionLabel}
      {/if}
    </button>
  </div>
</article>
