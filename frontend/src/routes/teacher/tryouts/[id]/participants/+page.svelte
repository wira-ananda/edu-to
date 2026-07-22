<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type {
    EnrollmentStatus,
    TryoutParticipantAttempt,
    TryoutParticipantItem,
  } from "$lib/types/admin";
  import {
    getEnrollmentStatusBadgeClass,
    getEnrollmentStatusLabel,
    getMaxAttemptsLabel,
    getTryoutStatusBadgeClass,
    getTryoutStatusLabel,
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

    return new Date(value).toLocaleString("id-ID");
  }

  function getAttemptStatusLabel(status: "ONGOING" | "FINISHED") {
    if (status === "FINISHED") return "Selesai";

    return "Berlangsung";
  }

  function getAttemptStatusBadgeClass(status: "ONGOING" | "FINISHED") {
    if (status === "FINISHED") {
      return "bg-emerald-50 text-emerald-700";
    }

    return "bg-amber-50 text-amber-700";
  }

  function getLatestAttempt(participant: TryoutParticipantItem) {
    return participant.attempts[participant.attempts.length - 1] ?? null;
  }

  function getAttemptScoreLabel(attempt: TryoutParticipantAttempt | null) {
    if (!attempt) return "-";

    if (attempt.status === "ONGOING") {
      return "Belum selesai";
    }

    return String(attempt.score);
  }

  async function loadParticipants() {
    if (!tryoutId) {
      errorMessage = "Tryout tidak ditemukan.";
      loading = false;
      return;
    }

    errorMessage = "";
    loading = participants.length === 0;

    try {
      const result = await apiFetch<TeacherTryoutParticipantsResponse>(
        `/teacher/tryouts/${tryoutId}/participants`,
      );

      data = result;
      participants = result.participants;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat daftar peserta.";
    } finally {
      loading = false;
    }
  }

  async function refreshParticipants() {
    refreshing = true;
    successMessage = "";

    try {
      await loadParticipants();
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

      await loadParticipants();
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal memasukkan siswa ke tryout.";
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

      await loadParticipants();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menyetujui peserta.";
    } finally {
      mutatingEnrollmentId = "";
    }
  }

  async function rejectEnrollment(enrollmentId: string) {
    const confirmed = confirm("Tolak peserta ini?");

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

      await loadParticipants();
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

<section class="space-y-5">
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <h2 class="text-2xl font-bold text-slate-950">Peserta Tryout</h2>

      <p class="mt-1 text-sm text-slate-500">
        Kelola siswa yang mendaftar atau sudah menjadi peserta tryout milikmu.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        onclick={() => goto("/teacher/tryouts")}
        class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700"
      >
        Kembali
      </button>

      <button
        type="button"
        onclick={refreshParticipants}
        disabled={loading || refreshing}
        class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"
      >
        {refreshing ? "Memuat..." : "Refresh"}
      </button>

      <button
        type="button"
        onclick={() => goto(`/teacher/results?tryoutId=${tryoutId}`)}
        disabled={!tryoutId}
        class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        Lihat Hasil
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

  {#if successMessage}
    <p
      class="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
    >
      {successMessage}
    </p>
  {/if}

  {#if loading}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-500">Memuat peserta...</p>
    </div>
  {:else if !tryout || !summary}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-700">
        Data tryout tidak ditemukan.
      </p>
    </div>
  {:else}
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
      >
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-slate-400">
            Tryout
          </p>

          <h3 class="mt-1 text-xl font-bold text-slate-950">
            {tryout.title}
          </h3>

          <div class="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span
              class={`rounded-full px-3 py-1 ${getTryoutStatusBadgeClass(
                tryout.status,
              )}`}
            >
              {getTryoutStatusLabel(tryout.status)}
            </span>

            <span class="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              Percobaan: {getMaxAttemptsLabel(tryout.maxAttempts)}
            </span>
          </div>
        </div>

        <form
          onsubmit={enrollStudent}
          class="flex w-full flex-col gap-2 lg:max-w-xl lg:flex-row"
        >
          <input
            bind:value={studentId}
            disabled={enrolling}
            placeholder="Masukkan Student ID untuk direct enroll"
            class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={enrolling || !studentId.trim()}
            class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enrolling ? "Memasukkan..." : "Tambah Peserta"}
          </button>
        </form>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Total Enrollment</p>

        <p class="mt-2 text-3xl font-bold text-slate-950">
          {summary.totalEnrollments}
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Disetujui</p>

        <p class="mt-2 text-3xl font-bold text-emerald-700">
          {summary.totalParticipants}
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Menunggu</p>

        <p class="mt-2 text-3xl font-bold text-amber-700">
          {summary.pendingRequests}
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Ditolak</p>

        <p class="mt-2 text-3xl font-bold text-red-700">
          {summary.rejectedParticipants}
        </p>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h3 class="text-lg font-bold text-slate-950">Daftar Peserta</h3>

          <p class="mt-1 text-sm text-slate-500">
            Total tampil: {filteredParticipants.length}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <label for="statusFilter" class="text-sm font-bold text-slate-700">
            Filter Status
          </label>

          <select
            id="statusFilter"
            bind:value={statusFilter}
            class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
          >
            <option value="ALL">Semua</option>
            <option value="PENDING">Menunggu</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </div>
      </div>

      <div class="mt-5 overflow-hidden rounded-xl border border-slate-200">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1120px] text-left text-sm">
            <thead
              class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"
            >
              <tr>
                <th class="px-5 py-4">Siswa</th>
                <th class="px-5 py-4">Status</th>
                <th class="px-5 py-4">Tanggal</th>
                <th class="px-5 py-4">Attempt</th>
                <th class="px-5 py-4">Nilai Terakhir</th>
                <th class="px-5 py-4">Progress</th>
                <th class="px-5 py-4">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {#if filteredParticipants.length === 0}
                <tr>
                  <td colspan="7" class="px-5 py-10 text-center text-slate-500">
                    Belum ada peserta dengan status ini.
                  </td>
                </tr>
              {:else}
                {#each filteredParticipants as participant}
                  {@const latestAttempt = getLatestAttempt(participant)}

                  <tr class="border-t border-slate-100">
                    <td class="px-5 py-4">
                      <p class="font-bold text-slate-900">
                        {participant.student.name}
                      </p>

                      <p class="text-xs text-slate-400">
                        {participant.student.email}
                      </p>

                      <p class="text-xs text-slate-400">
                        {participant.student.school ?? "-"} · {participant
                          .student.className ?? "-"}
                      </p>

                      <p class="mt-1 text-[11px] font-semibold text-slate-400">
                        ID: {participant.student.id}
                      </p>
                    </td>

                    <td class="px-5 py-4">
                      <span
                        class={`rounded-full px-3 py-1 text-xs font-bold ${getEnrollmentStatusBadgeClass(
                          participant.status,
                        )}`}
                      >
                        {getEnrollmentStatusLabel(participant.status)}
                      </span>
                    </td>

                    <td class="px-5 py-4 text-xs text-slate-500">
                      <p>Request: {formatDate(participant.requestedAt)}</p>
                      <p>Approve: {formatDate(participant.approvedAt)}</p>
                      <p>Reject: {formatDate(participant.rejectedAt)}</p>
                    </td>

                    <td class="px-5 py-4 font-bold text-slate-900">
                      {participant.attempts.length}
                    </td>

                    <td class="px-5 py-4 font-bold text-blue-900">
                      {getAttemptScoreLabel(latestAttempt)}
                    </td>

                    <td class="px-5 py-4">
                      {#if participant.attempts.length === 0}
                        <p class="text-xs font-semibold text-slate-400">
                          Belum mengerjakan.
                        </p>
                      {:else}
                        <div class="flex flex-col gap-2">
                          {#each participant.attempts as attempt}
                            <div
                              class="rounded-lg border border-slate-100 bg-slate-50 p-2"
                            >
                              <div
                                class="flex items-center justify-between gap-2"
                              >
                                <p class="text-xs font-bold text-slate-800">
                                  Attempt #{attempt.attemptNumber}
                                </p>

                                <span
                                  class={`rounded-full px-2 py-0.5 text-[11px] font-bold ${getAttemptStatusBadgeClass(
                                    attempt.status,
                                  )}`}
                                >
                                  {getAttemptStatusLabel(attempt.status)}
                                </span>
                              </div>

                              <p class="mt-1 text-xs text-slate-500">
                                Nilai: {attempt.score} · Benar:
                                {attempt.correctCount} · Salah:
                                {attempt.wrongCount}
                              </p>

                              <p class="text-xs text-slate-500">
                                Progress: {attempt.answeredCount}/{attempt.totalQuestions}
                              </p>
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </td>

                    <td class="px-5 py-4">
                      <div class="flex flex-wrap gap-2">
                        {#if participant.status !== "APPROVED"}
                          <button
                            type="button"
                            disabled={mutatingEnrollmentId === participant.id}
                            onclick={() => approveEnrollment(participant.id)}
                            class="rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        {/if}

                        {#if participant.status !== "REJECTED"}
                          <button
                            type="button"
                            disabled={mutatingEnrollmentId === participant.id}
                            onclick={() => rejectEnrollment(participant.id)}
                            class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        {/if}
                      </div>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
</section>
