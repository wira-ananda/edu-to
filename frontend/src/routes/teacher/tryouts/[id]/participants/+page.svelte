<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import TryoutJoinCodeCard from "$lib/components/tryouts/TryoutJoinCodeCard.svelte";
  import {
    getTeacherTryoutParticipantsCached,
    invalidateTeacherTryoutParticipantsCache,
    invalidateTeacherTryoutResultsCache,
    invalidateTeacherTryoutsCache,
    invalidateTeacherTryoutStatisticsCache,
    readTeacherTryoutParticipantsCache,
  } from "$lib/cache/teacher-page-cache";
  import {
    getEnrollmentStatusBadgeClass,
    getEnrollmentStatusLabel,
    getMaxAttemptsLabel,
    getTryoutStatusBadgeClass,
    getTryoutStatusLabel,
  } from "$lib/types/admin";
  import type {
    EnrollmentStatus,
    TryoutParticipantAttempt,
    TryoutParticipantItem,
  } from "$lib/types/admin";
  import type {
    TeacherEnrollStudentResponse,
    TeacherMutateEnrollmentResponse,
    TeacherTryoutParticipantsResponse,
  } from "$lib/types/teacher";

  const tryoutId = $derived(page.params.id ?? "");

  let loading = $state(true);
  let refreshing = $state(false);
  let enrolling = $state(false);

  let mutatingEnrollmentId = $state("");

  let errorMessage = $state("");
  let successMessage = $state("");

  let studentId = $state("");

  let statusFilter = $state<"ALL" | EnrollmentStatus>("ALL");

  let data = $state<TeacherTryoutParticipantsResponse | null>(null);

  let participants = $state<TryoutParticipantItem[]>([]);

  const tryout = $derived(data?.tryout ?? null);

  const summary = $derived(data?.summary ?? null);

  const filteredParticipants = $derived(
    statusFilter === "ALL"
      ? participants
      : participants.filter(
          (participant) => participant.status === statusFilter,
        ),
  );

  function formatDate(value: string | null | undefined) {
    if (!value) return "-";

    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function getAttemptStatusLabel(status: "ONGOING" | "FINISHED") {
    return status === "FINISHED" ? "Selesai" : "Berlangsung";
  }

  function getAttemptStatusBadgeClass(status: "ONGOING" | "FINISHED") {
    return status === "FINISHED"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-amber-50 text-amber-700";
  }

  function getLatestAttempt(participant: TryoutParticipantItem) {
    return participant.attempts[participant.attempts.length - 1] ?? null;
  }

  function getAttemptScoreLabel(attempt: TryoutParticipantAttempt | null) {
    if (!attempt) {
      return "-";
    }

    if (attempt.status === "ONGOING") {
      return "Belum selesai";
    }

    return String(attempt.score);
  }

  async function loadParticipants(
    options: {
      force?: boolean;
    } = {},
  ) {
    const force = options.force ?? false;

    if (!tryoutId) {
      errorMessage = "Tryout tidak ditemukan.";

      loading = false;
      return;
    }

    errorMessage = "";

    const cachedData = !force
      ? readTeacherTryoutParticipantsCache(tryoutId)
      : null;

    if (cachedData) {
      data = cachedData;

      participants = cachedData.participants;

      loading = false;
      return;
    }

    loading = participants.length === 0;

    try {
      const result = await getTeacherTryoutParticipantsCached(tryoutId, {
        force,
      });

      data = result;
      participants = result.participants;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat daftar peserta.";
    } finally {
      loading = false;
    }
  }

  function invalidateParticipantMutationCaches() {
    invalidateTeacherTryoutsCache();

    invalidateTeacherTryoutParticipantsCache(tryoutId);

    invalidateTeacherTryoutResultsCache(tryoutId);

    invalidateTeacherTryoutStatisticsCache(tryoutId);
  }

  async function refreshParticipants() {
    refreshing = true;
    successMessage = "";

    invalidateTeacherTryoutParticipantsCache(tryoutId);

    try {
      await loadParticipants({
        force: true,
      });
    } finally {
      refreshing = false;
    }
  }

  async function enrollStudent(event: SubmitEvent) {
    event.preventDefault();

    const cleanedStudentId = studentId.trim();

    if (!cleanedStudentId) {
      errorMessage = "Student ID wajib diisi.";

      return;
    }

    enrolling = true;

    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<TeacherEnrollStudentResponse>(
        `/teacher/tryouts/${tryoutId}/participants/${cleanedStudentId}`,
        {
          method: "POST",
        },
      );

      successMessage = result.message;

      studentId = "";

      invalidateParticipantMutationCaches();

      await loadParticipants({
        force: true,
      });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menambahkan peserta.";
    } finally {
      enrolling = false;
    }
  }

  async function approveEnrollment(enrollmentId: string) {
    mutatingEnrollmentId = enrollmentId;

    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<TeacherMutateEnrollmentResponse>(
        `/teacher/enrollments/${enrollmentId}/approve`,
        {
          method: "PATCH",
        },
      );

      successMessage = result.message;

      invalidateParticipantMutationCaches();

      await loadParticipants({
        force: true,
      });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menyetujui peserta.";
    } finally {
      mutatingEnrollmentId = "";
    }
  }

  async function rejectEnrollment(enrollmentId: string) {
    const confirmed = confirm("Tolak permintaan peserta ini?");

    if (!confirmed) return;

    mutatingEnrollmentId = enrollmentId;

    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<TeacherMutateEnrollmentResponse>(
        `/teacher/enrollments/${enrollmentId}/reject`,
        {
          method: "PATCH",
        },
      );

      successMessage = result.message;

      invalidateParticipantMutationCaches();

      await loadParticipants({
        force: true,
      });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menolak peserta.";
    } finally {
      mutatingEnrollmentId = "";
    }
  }

  onMount(() => {
    void loadParticipants();
  });
</script>

<section class="space-y-6">
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <button
        type="button"
        onclick={() => goto("/teacher/tryouts")}
        class="mb-3 inline-flex items-center gap-2 text-sm font-bold text-[#0c438c]"
      >
        ← Kembali ke Tryout
      </button>

      <h2 class="text-2xl font-black tracking-tight text-slate-950">
        Peserta Tryout
      </h2>

      <p class="mt-1 text-sm text-slate-500">
        Kelola permintaan bergabung dan pantau aktivitas peserta.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        onclick={refreshParticipants}
        disabled={loading || refreshing}
        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"
      >
        {refreshing ? "Memuat..." : "Refresh"}
      </button>

      <button
        type="button"
        onclick={() => goto(`/teacher/results?tryoutId=${tryoutId}`)}
        disabled={!tryoutId}
        class="rounded-xl bg-[#062b63] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        Lihat Hasil
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
      <p class="text-sm font-semibold text-slate-500">Memuat peserta...</p>
    </div>
  {:else if !tryout || !summary}
    <div class="rounded-2xl border border-slate-200 bg-white p-8">
      Data tryout tidak ditemukan.
    </div>
  {:else}
    <!-- Tryout information -->
    <div class="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
      <div
        class="relative overflow-hidden rounded-2xl bg-[#062b63] p-6 text-white"
      >
        <div
          class="absolute -right-16 -top-20 h-48 w-48 rotate-12 rounded-[50px] bg-[#0c438c]"
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
            class="mt-6 text-xs font-black uppercase tracking-[0.16em] text-blue-200"
          >
            Tryout
          </p>

          <h3 class="mt-1 text-2xl font-black">
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
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-bold uppercase tracking-wide text-slate-400">
          Total Enrollment
        </p>

        <p class="mt-2 text-3xl font-black text-slate-950">
          {summary.totalEnrollments}
        </p>
      </div>

      <div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
        <p class="text-xs font-bold uppercase tracking-wide text-emerald-600">
          Disetujui
        </p>

        <p class="mt-2 text-3xl font-black text-emerald-700">
          {summary.totalParticipants}
        </p>
      </div>

      <div class="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <p class="text-xs font-bold uppercase tracking-wide text-amber-600">
          Menunggu
        </p>

        <p class="mt-2 text-3xl font-black text-amber-700">
          {summary.pendingRequests}
        </p>
      </div>

      <div class="rounded-2xl border border-red-100 bg-red-50 p-5">
        <p class="text-xs font-bold uppercase tracking-wide text-red-500">
          Ditolak
        </p>

        <p class="mt-2 text-3xl font-black text-red-600">
          {summary.rejectedParticipants}
        </p>
      </div>
    </div>

    <!-- Manual enrollment -->
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h3 class="text-base font-black text-slate-950">
            Tambah Peserta Manual
          </h3>

          <p class="mt-1 text-sm text-slate-500">
            Gunakan Student ID jika ingin memasukkan siswa tanpa permintaan
            join.
          </p>
        </div>

        <form
          onsubmit={enrollStudent}
          class="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl"
        >
          <input
            bind:value={studentId}
            disabled={enrolling}
            placeholder="Masukkan Student ID"
            class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#0c438c] focus:bg-white"
          />

          <button
            type="submit"
            disabled={enrolling || !studentId.trim()}
            class="rounded-xl bg-[#062b63] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {enrolling ? "Menambahkan..." : "Tambah Peserta"}
          </button>
        </form>
      </div>
    </section>

    <!-- Participant list -->
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
          {#each [{ value: "ALL", label: "Semua" }, { value: "PENDING", label: "Menunggu" }, { value: "APPROVED", label: "Disetujui" }, { value: "REJECTED", label: "Ditolak" }] as filter}
            <button
              type="button"
              onclick={() =>
                (statusFilter = filter.value as "ALL" | EnrollmentStatus)}
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
          class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500"
        >
          Belum ada peserta dengan status ini.
        </div>
      {:else}
        <div class="space-y-3">
          {#each filteredParticipants as participant}
            {@const latestAttempt = getLatestAttempt(participant)}

            <article
              class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 class="font-black text-slate-950">
                        {participant.student.name}
                      </h4>

                      <p class="mt-1 text-sm text-slate-500">
                        {participant.student.email}
                      </p>

                      <p class="mt-0.5 text-xs text-slate-400">
                        {participant.student.school ?? "-"}
                        ·
                        {participant.student.className ?? "-"}
                      </p>
                    </div>

                    <span
                      class={`rounded-full px-3 py-1 text-xs font-bold ${getEnrollmentStatusBadgeClass(
                        participant.status,
                      )}`}
                    >
                      {getEnrollmentStatusLabel(participant.status)}
                    </span>
                  </div>

                  <div class="mt-4 grid gap-3 sm:grid-cols-3">
                    <div class="rounded-xl bg-slate-50 p-3">
                      <p class="text-[10px] font-bold uppercase text-slate-400">
                        Percobaan
                      </p>

                      <p class="mt-1 text-lg font-black text-slate-950">
                        {participant.attempts.length}
                      </p>
                    </div>

                    <div class="rounded-xl bg-slate-50 p-3">
                      <p class="text-[10px] font-bold uppercase text-slate-400">
                        Nilai Terakhir
                      </p>

                      <p class="mt-1 text-lg font-black text-[#0c438c]">
                        {getAttemptScoreLabel(latestAttempt)}
                      </p>
                    </div>

                    <div class="rounded-xl bg-slate-50 p-3">
                      <p class="text-[10px] font-bold uppercase text-slate-400">
                        Bergabung
                      </p>

                      <p class="mt-1 text-xs font-bold text-slate-600">
                        {formatDate(participant.requestedAt)}
                      </p>
                    </div>
                  </div>

                  {#if participant.attempts.length > 0}
                    <details
                      class="mt-4 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      <summary
                        class="cursor-pointer px-4 py-3 text-sm font-bold text-slate-700"
                      >
                        Lihat riwayat percobaan ({participant.attempts.length})
                      </summary>

                      <div class="space-y-2 border-t border-slate-200 p-3">
                        {#each participant.attempts as attempt}
                          <div
                            class="flex flex-col gap-2 rounded-xl bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <div class="flex items-center gap-2">
                                <p class="text-xs font-black text-slate-900">
                                  Percobaan #{attempt.attemptNumber}
                                </p>

                                <span
                                  class={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getAttemptStatusBadgeClass(
                                    attempt.status,
                                  )}`}
                                >
                                  {getAttemptStatusLabel(attempt.status)}
                                </span>
                              </div>

                              <p class="mt-1 text-xs text-slate-500">
                                {attempt.answeredCount}/{attempt.totalQuestions}
                                dijawab · Benar
                                {attempt.correctCount}
                                · Salah
                                {attempt.wrongCount}
                              </p>
                            </div>

                            <p class="text-xl font-black text-[#0c438c]">
                              {attempt.score}
                            </p>
                          </div>
                        {/each}
                      </div>
                    </details>
                  {/if}
                </div>

                <div class="flex shrink-0 flex-wrap gap-2 xl:w-40 xl:flex-col">
                  {#if participant.status !== "APPROVED"}
                    <button
                      type="button"
                      disabled={mutatingEnrollmentId === participant.id}
                      onclick={() => approveEnrollment(participant.id)}
                      class="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Setujui
                    </button>
                  {/if}

                  {#if participant.status !== "REJECTED"}
                    <button
                      type="button"
                      disabled={mutatingEnrollmentId === participant.id}
                      onclick={() => rejectEnrollment(participant.id)}
                      class="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Tolak
                    </button>
                  {/if}
                </div>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</section>
