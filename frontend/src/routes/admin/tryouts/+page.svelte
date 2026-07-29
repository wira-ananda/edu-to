<script lang="ts">
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";

  import TryoutManagementList from "$lib/components/tryouts/TryoutManagementList.svelte";

  import {
    getAdminTryoutsCached,
    invalidateAdminTryoutsCache,
    readAdminTryoutsCache,
  } from "$lib/cache/admin-page-cache";

  import type {
    AdminTryoutItem,
    MutateTryoutResponse,
    RegenerateTryoutJoinCodeResponse,
    TryoutStatus,
    UpdateTryoutStatusPayload,
  } from "$lib/types/admin";

  let loading = $state(true);
  let refreshing = $state(false);

  let deletingId = $state("");
  let updatingStatusId = $state("");
  let regeneratingCodeId = $state("");

  let errorMessage = $state("");
  let successMessage = $state("");

  let tryouts = $state<AdminTryoutItem[]>([]);

  function isValidTryoutCache(cachedTryouts: AdminTryoutItem[]) {
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

  async function loadTryouts(
    options: {
      force?: boolean;
    } = {},
  ) {
    const force = options.force ?? false;

    errorMessage = "";

    const cachedTryouts = !force ? readAdminTryoutsCache() : null;

    if (cachedTryouts && isValidTryoutCache(cachedTryouts)) {
      tryouts = cachedTryouts;
      loading = false;
      return;
    }

    loading = tryouts.length === 0;

    try {
      tryouts = await getAdminTryoutsCached({
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

    invalidateAdminTryoutsCache();

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

      const result = await apiFetch<MutateTryoutResponse>(
        `/admin/tryouts/${tryoutId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      successMessage = result.message;

      invalidateAdminTryoutsCache();

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
      const result = await apiFetch<RegenerateTryoutJoinCodeResponse>(
        `/admin/tryouts/${tryoutId}/join-code/regenerate`,
        {
          method: "PATCH",
        },
      );

      successMessage = result.message;

      invalidateAdminTryoutsCache();

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

  async function deleteTryout(tryoutId: string) {
    const confirmed = confirm("Hapus tryout ini?");

    if (!confirmed) {
      return;
    }

    deletingId = tryoutId;

    errorMessage = "";
    successMessage = "";

    try {
      await apiFetch(`/admin/tryouts/${tryoutId}`, {
        method: "DELETE",
      });

      invalidateAdminTryoutsCache();

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

  onMount(() => {
    void loadTryouts();
  });
</script>

<TryoutManagementList
  {tryouts}
  {loading}
  {refreshing}
  {deletingId}
  {updatingStatusId}
  {regeneratingCodeId}
  {errorMessage}
  {successMessage}
  title="Tryout"
  eyebrow="Pembelajaran"
  description="Kelola seluruh paket tryout, peserta, akses siswa, dan hasil pengerjaan."
  createHref="/admin/tryouts/new"
  showOwner
  getParticipantsHref={(id) => `/admin/tryouts/${id}/participants`}
  getResultsHref={(id) => `/admin/results?tryoutId=${id}`}
  getEditHref={(id) => `/admin/tryouts/${id}/edit`}
  onRefresh={refreshTryouts}
  onStatusChange={updateTryoutStatus}
  onRegenerateCode={regenerateJoinCode}
  onDelete={deleteTryout}
/>
