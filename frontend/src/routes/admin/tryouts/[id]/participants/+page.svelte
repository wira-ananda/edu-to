<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import TryoutParticipantsManagement from "$lib/components/tryouts/TryoutParticipantsManagement.svelte";

  import {
    getAdminTryoutParticipantsCached,
    invalidateAdminTryoutParticipantsCache,
    invalidateAdminTryoutsCache,
    readAdminTryoutParticipantsCache,
  } from "$lib/cache/admin-page-cache";

  import type {
    EnrollStudentResponse,
    MutateEnrollmentResponse,
    TryoutParticipantItem,
    TryoutParticipantsResponse,
  } from "$lib/types/admin";

  const tryoutId = $derived(page.params.id ?? "");

  let loading = $state(true);
  let refreshing = $state(false);
  let enrolling = $state(false);
  let mutatingEnrollmentId = $state("");

  let errorMessage = $state("");
  let successMessage = $state("");

  let data = $state<TryoutParticipantsResponse | null>(null);

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
      ? readAdminTryoutParticipantsCache(tryoutId)
      : null;

    if (cachedData) {
      data = cachedData;
      participants = cachedData.participants;

      loading = false;

      return;
    }

    loading = participants.length === 0;

    try {
      const result = await getAdminTryoutParticipantsCached(tryoutId, {
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
    invalidateAdminTryoutsCache();
    invalidateAdminTryoutParticipantsCache(tryoutId);
  }

  async function refreshParticipants() {
    refreshing = true;
    successMessage = "";

    invalidateAdminTryoutParticipantsCache(tryoutId);

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
      const result = await apiFetch<EnrollStudentResponse>(
        `/admin/tryouts/${tryoutId}/participants/${studentId}`,
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
        error instanceof Error
          ? error.message
          : "Gagal memasukkan siswa ke tryout.";

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
      const result = await apiFetch<MutateEnrollmentResponse>(
        `/admin/enrollments/${enrollmentId}/approve`,
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
      const result = await apiFetch<MutateEnrollmentResponse>(
        `/admin/enrollments/${enrollmentId}/reject`,
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
  backHref="/admin/tryouts"
  resultsHref={`/admin/results?tryoutId=${tryoutId}`}
  onRefresh={refreshParticipants}
  onEnrollStudent={enrollStudent}
  onApprove={approveEnrollment}
  onReject={rejectEnrollment}
/>
