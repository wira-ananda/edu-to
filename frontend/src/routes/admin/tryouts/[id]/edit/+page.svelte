<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import TryoutForm from "$lib/components/tryouts/TryoutForm.svelte";

  import { invalidateAdminTryoutRelatedCaches } from "$lib/cache/admin-page-cache";

  import type {
    AdminTryoutResponse,
    MutateTryoutResponse,
  } from "$lib/types/admin";

  import type {
    TryoutFormInitialValue,
    TryoutFormPayload,
    TryoutFormSubject,
  } from "$lib/types/tryout-form";

  type TryoutSubjectsResponse = {
    ok: boolean;
    subjects: TryoutFormSubject[];
  };

  const id = $derived(page.params.id ?? "");

  let subjects = $state<TryoutFormSubject[]>([]);

  let tryout = $state<TryoutFormInitialValue | null>(null);

  let loading = $state(true);
  let saving = $state(false);

  let errorMessage = $state("");

  async function loadData() {
    if (!id) {
      errorMessage = "ID tryout tidak valid.";

      loading = false;

      return;
    }

    loading = true;

    errorMessage = "";

    try {
      const [subjectsResult, tryoutResult] = await Promise.all([
        apiFetch<TryoutSubjectsResponse>("/admin/subjects"),

        apiFetch<AdminTryoutResponse>(`/admin/tryouts/${id}`),
      ]);

      subjects = subjectsResult.subjects;

      tryout = {
        id: tryoutResult.tryout.id,
        subjectId: tryoutResult.tryout.subjectId,
        title: tryoutResult.tryout.title,
        totalQuestions: tryoutResult.tryout.totalQuestions,
        durationMinutes: tryoutResult.tryout.durationMinutes,
        maxAttempts: tryoutResult.tryout.maxAttempts,
        status: tryoutResult.tryout.status,
      };
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat data tryout.";
    } finally {
      loading = false;
    }
  }

  async function updateTryout(payload: TryoutFormPayload) {
    if (!id) {
      errorMessage = "ID tryout tidak valid.";

      return;
    }

    saving = true;

    errorMessage = "";

    try {
      await apiFetch<MutateTryoutResponse>(`/admin/tryouts/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      invalidateAdminTryoutRelatedCaches(id);

      await goto("/admin/tryouts");
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memperbarui tryout.";
    } finally {
      saving = false;
    }
  }

  onMount(() => {
    void loadData();
  });
</script>

{#if errorMessage && loading}
  <div
    class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
  >
    {errorMessage}
  </div>
{:else if loading}
  <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <div class="flex items-center gap-3">
      <div
        class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0c438c]"
      ></div>

      <p class="text-sm font-semibold text-slate-500">Memuat tryout...</p>
    </div>
  </div>
{:else if tryout}
  <TryoutForm
    mode="edit"
    {subjects}
    initialTryout={tryout}
    {saving}
    {errorMessage}
    backHref="/admin/tryouts"
    questionBankHref="/admin/questions"
    newQuestionHref="/admin/questions/new"
    description="Perbarui konfigurasi paket tryout."
    onSubmit={updateTryout}
  />
{/if}
