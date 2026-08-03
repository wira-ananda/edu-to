<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import TryoutParticipantsManagement from "$lib/components/tryouts/TryoutParticipantsManagement.svelte";

  import {
    getTeacherTryoutParticipantsCached,
    invalidateTeacherTryoutParticipantsCache,
    invalidateTeacherTryoutResultsCache,
    invalidateTeacherTryoutsCache,
    invalidateTeacherTryoutStatisticsCache,
    readTeacherTryoutParticipantsCache,
  } from "$lib/cache/teacher-page-cache";

  import type { TryoutParticipantItem } from "$lib/types/admin";

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

  let data = $state<TeacherTryoutParticipantsResponse | null>(null);

  let participants = $state<TryoutParticipantItem[]>([]);

  const tryout = $derived(data?.tryout ?? null);
  const summary = $derived(data?.summary ?? null);

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

  function invalidateParticipantCaches() {
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

  async function enrollStudent(studentId: string) {
    enrolling = true;

    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<TeacherEnrollStudentResponse>(
        `/teacher/tryouts/${tryoutId}/participants/${studentId}`,
        {
          method: "POST",
        },
      );

      successMessage = result.message;

      invalidateParticipantCaches();

      await loadParticipants({
        force: true,
      });

      return true;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menambahkan peserta.";

      return false;
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

      invalidateParticipantCaches();

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

    if (!confirmed) {
      return;
    }

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

      invalidateParticipantCaches();

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

<TryoutParticipantsManagement
  {tryout}
  {summary}
  {participants}
  {loading}
  {refreshing}
  {enrolling}
  {mutatingEnrollmentId}
  {errorMessage}
  {successMessage}
  backHref="/teacher/tryouts"
  resultsHref={`/teacher/results?tryoutId=${tryoutId}`}
  comparisonHref={`/teacher/results/${tryoutId}/comparison`}
  onRefresh={refreshParticipants}
  onEnrollStudent={enrollStudent}
  onApprove={approveEnrollment}
  onReject={rejectEnrollment}
/>
