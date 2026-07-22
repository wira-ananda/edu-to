<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import {
    getStudentTryoutsCached,
    invalidateStudentSessionsCache,
    invalidateStudentTryoutsCache,
    readStudentTryoutsCache,
  } from "$lib/cache/student-page-cache";
  import type {
    RequestJoinTryoutResponse,
    StartTryoutResponse,
    StudentTryoutItem,
  } from "$lib/types/student";
  import {
    getEnrollmentStatusBadgeClass,
    getEnrollmentStatusLabel,
    getMaxAttemptsLabel,
  } from "$lib/types/admin";

  let loading = $state(true);
  let refreshing = $state(false);
  let startingTryoutId = $state("");
  let requestingJoinTryoutId = $state("");
  let errorMessage = $state("");
  let successMessage = $state("");
  let tryouts = $state<StudentTryoutItem[]>([]);

  function isValidEnrollmentCache(cachedTryouts: StudentTryoutItem[]) {
    return cachedTryouts.every((tryout) => "enrollmentStatus" in tryout);
  }

  function getOwnerLabel(tryout: StudentTryoutItem) {
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
  }

  function getAttemptsRemainingLabel(tryout: StudentTryoutItem) {
    if (tryout.maxAttempts === null) {
      return "Tanpa batas";
    }

    return `${tryout.attemptsRemaining ?? 0} tersisa`;
  }

  function getEnrollmentDescription(tryout: StudentTryoutItem) {
    if (tryout.enrollmentStatus === "APPROVED") {
      return "Kamu sudah terdaftar dan bisa mengerjakan tryout ini.";
    }

    if (tryout.enrollmentStatus === "PENDING") {
      return "Permintaanmu sedang menunggu persetujuan admin atau guru.";
    }

    if (tryout.enrollmentStatus === "REJECTED") {
      return "Permintaanmu ditolak. Hubungi guru atau admin jika perlu.";
    }

    return "Kamu perlu meminta akses sebelum bisa mengerjakan tryout ini.";
  }

  function getStartDisabledReason(tryout: StudentTryoutItem) {
    if (tryout.bank.totalAvailableQuestions < tryout.totalQuestions) {
      return "Soal tersedia tidak cukup untuk tryout ini.";
    }

    if (tryout.enrollmentStatus !== "APPROVED") {
      if (tryout.enrollmentStatus === "PENDING") {
        return "Permintaan bergabung masih menunggu persetujuan.";
      }

      if (tryout.enrollmentStatus === "REJECTED") {
        return "Permintaan bergabung sudah ditolak.";
      }

      return "Kamu harus meminta akses terlebih dahulu.";
    }

    if (tryout.ongoingSessionId) {
      return "";
    }

    if (!tryout.canStart) {
      return "Batas percobaan untuk tryout ini sudah habis.";
    }

    return "";
  }

  function getActionLabel(tryout: StudentTryoutItem) {
    if (tryout.canRequestJoin) {
      return "Minta Bergabung";
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
  }

  async function loadTryouts(options: { force?: boolean } = {}) {
    const force = options.force ?? false;

    errorMessage = "";

    const cachedTryouts = !force ? readStudentTryoutsCache() : null;

    if (cachedTryouts && isValidEnrollmentCache(cachedTryouts)) {
      tryouts = cachedTryouts;
      loading = false;
      return;
    }

    loading = tryouts.length === 0;

    try {
      tryouts = await getStudentTryoutsCached({ force: true });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat daftar tryout.";
    } finally {
      loading = false;
    }
  }

  async function refreshTryouts() {
    refreshing = true;
    invalidateStudentTryoutsCache();

    try {
      await loadTryouts({ force: true });
    } finally {
      refreshing = false;
    }
  }

  async function requestJoinTryout(tryout: StudentTryoutItem) {
    requestingJoinTryoutId = tryout.id;
    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<RequestJoinTryoutResponse>(
        `/student/tryouts/${tryout.id}/request-join`,
        {
          method: "POST",
        },
      );

      successMessage = result.message;
      invalidateStudentTryoutsCache();

      await loadTryouts({ force: true });
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal mengirim permintaan bergabung.";
    } finally {
      requestingJoinTryoutId = "";
    }
  }

  async function startTryout(tryout: StudentTryoutItem) {
    if (tryout.canRequestJoin) {
      await requestJoinTryout(tryout);
      return;
    }

    if (tryout.ongoingSessionId) {
      await goto(`/student/tryouts/${tryout.ongoingSessionId}`);
      return;
    }

    startingTryoutId = tryout.id;
    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<StartTryoutResponse>(
        "/student/tryouts/start",
        {
          method: "POST",
          body: JSON.stringify({
            tryoutId: tryout.id,
          }),
        },
      );

      invalidateStudentSessionsCache();
      invalidateStudentTryoutsCache();

      await goto(`/student/tryouts/${result.session.id}`);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memulai tryout.";
    } finally {
      startingTryoutId = "";
    }
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
      <h2 class="text-2xl font-bold text-slate-950">Mulai Tryout</h2>

      <p class="mt-1 text-sm text-slate-500">
        Pilih paket tryout yang sudah dibuka oleh admin atau guru. Kamu perlu
        mendapat persetujuan sebelum bisa mengerjakan.
      </p>
    </div>

    <button
      type="button"
      onclick={refreshTryouts}
      disabled={loading || refreshing}
      class="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-60"
    >
      {refreshing ? "Memuat..." : "Refresh"}
    </button>
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
      Memuat tryout...
    </div>
  {:else if tryouts.length === 0}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-600">
        Belum ada tryout yang tersedia.
      </p>

      <p class="mt-2 text-sm text-slate-500">
        Tryout akan muncul jika statusnya sudah dibuka.
      </p>
    </div>
  {:else}
    <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {#each tryouts as tryout}
        {@const disabledReason = getStartDisabledReason(tryout)}

        <article
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p
                class="text-sm font-semibold uppercase tracking-wide text-slate-400"
              >
                Tryout
              </p>

              <h3 class="mt-1 text-xl font-bold text-slate-950">
                {tryout.title}
              </h3>
            </div>

            <span
              class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
            >
              Dibuka
            </span>
          </div>

          <div class="mt-3 space-y-1">
            <p class="text-sm text-slate-500">
              Bank soal:
              <span class="font-semibold text-slate-700">
                {tryout.bank.name}
              </span>
            </p>

            <p class="text-sm text-slate-500">
              Dibuat oleh:
              <span class="font-semibold text-slate-700">
                {getOwnerLabel(tryout)}
              </span>
            </p>
          </div>

          <div class="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p
                class="text-xs font-bold uppercase tracking-wide text-slate-400"
              >
                Status Peserta
              </p>

              <span
                class={`rounded-full px-3 py-1 text-xs font-bold ${getEnrollmentStatusBadgeClass(
                  tryout.enrollmentStatus,
                )}`}
              >
                {getEnrollmentStatusLabel(tryout.enrollmentStatus)}
              </span>
            </div>

            <p class="mt-2 text-xs font-semibold text-slate-600">
              {getEnrollmentDescription(tryout)}
            </p>
          </div>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-slate-50 p-4">
              <p
                class="text-xs font-bold uppercase tracking-wide text-slate-400"
              >
                Jumlah Soal
              </p>

              <p class="mt-1 text-2xl font-bold text-slate-950">
                {tryout.totalQuestions}
              </p>
            </div>

            <div class="rounded-xl bg-slate-50 p-4">
              <p
                class="text-xs font-bold uppercase tracking-wide text-slate-400"
              >
                Durasi
              </p>

              <p class="mt-1 text-2xl font-bold text-slate-950">
                {tryout.durationMinutes}
                <span class="text-sm font-semibold text-slate-500">menit</span>
              </p>
            </div>

            <div class="rounded-xl bg-slate-50 p-4">
              <p
                class="text-xs font-bold uppercase tracking-wide text-slate-400"
              >
                Percobaan
              </p>

              <p class="mt-1 text-lg font-bold text-slate-950">
                {tryout.attemptsUsed}
                <span class="text-sm font-semibold text-slate-500">
                  terpakai
                </span>
              </p>
            </div>

            <div class="rounded-xl bg-slate-50 p-4">
              <p
                class="text-xs font-bold uppercase tracking-wide text-slate-400"
              >
                Batas
              </p>

              <p class="mt-1 text-lg font-bold text-slate-950">
                {getMaxAttemptsLabel(tryout.maxAttempts)}
              </p>
            </div>
          </div>

          <div class="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p class="text-xs font-semibold text-slate-600">
              Sisa percobaan:
              <span class="font-bold text-slate-950">
                {getAttemptsRemainingLabel(tryout)}
              </span>
            </p>

            {#if tryout.ongoingSessionId}
              <p class="mt-1 text-xs font-semibold text-amber-700">
                Ada sesi yang sedang berjalan. Kamu bisa melanjutkannya.
              </p>
            {:else if tryout.enrollmentStatus === "APPROVED" && !tryout.canStart}
              <p class="mt-1 text-xs font-semibold text-red-600">
                Kamu sudah mencapai batas percobaan.
              </p>
            {/if}
          </div>

          <p class="mt-4 text-xs text-slate-500">
            Sistem menentukan level awal secara acak. Soal berikutnya dipilih
            menggunakan Weighted Random Selection.
          </p>

          {#if disabledReason && !tryout.canRequestJoin}
            <p
              class="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
            >
              {disabledReason}
            </p>
          {/if}

          <button
            type="button"
            disabled={(Boolean(disabledReason) && !tryout.canRequestJoin) ||
              startingTryoutId === tryout.id ||
              requestingJoinTryoutId === tryout.id}
            onclick={() => startTryout(tryout)}
            class="mt-5 w-full rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {#if startingTryoutId === tryout.id}
              Memulai...
            {:else if requestingJoinTryoutId === tryout.id}
              Mengirim...
            {:else}
              {getActionLabel(tryout)}
            {/if}
          </button>
        </article>
      {/each}
    </div>
  {/if}
</section>
