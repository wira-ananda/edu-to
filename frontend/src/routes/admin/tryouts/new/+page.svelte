<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import TryoutForm from "$lib/components/tryouts/TryoutForm.svelte";

  import { invalidateAdminTryoutsCache } from "$lib/cache/admin-page-cache";

  import type { MutateTryoutResponse } from "$lib/types/admin";

  import type {
    TryoutFormPayload,
    TryoutFormSubject,
  } from "$lib/types/tryout-form";

  type TryoutSubjectsResponse = {
    ok: boolean;
    subjects: TryoutFormSubject[];
  };

  const defaultSubjectId = $derived(
    page.url.searchParams.get("subjectId") ?? "",
  );

  let subjects = $state<TryoutFormSubject[]>([]);

  let loading = $state(true);
  let saving = $state(false);

  let errorMessage = $state("");

  async function loadSubjects() {
    loading = true;

    errorMessage = "";

    try {
      const result = await apiFetch<TryoutSubjectsResponse>("/admin/subjects");

      subjects = result.subjects;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat bank soal.";
    } finally {
      loading = false;
    }
  }

  async function createTryout(payload: TryoutFormPayload) {
    saving = true;

    errorMessage = "";

    try {
      await apiFetch<MutateTryoutResponse>("/admin/tryouts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      invalidateAdminTryoutsCache();

      await goto("/admin/tryouts");
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal membuat tryout.";
    } finally {
      saving = false;
    }
  }

  onMount(() => {
    void loadSubjects();
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

      <p class="text-sm font-semibold text-slate-500">Memuat bank soal...</p>
    </div>
  </div>
{:else}
  <TryoutForm
    mode="create"
    {subjects}
    {defaultSubjectId}
    {saving}
    {errorMessage}
    backHref="/admin/tryouts"
    questionBankHref="/admin/questions"
    newQuestionHref="/admin/questions/new"
    description="Buat paket tryout dari bank soal yang tersedia di sistem."
    onSubmit={createTryout}
  />
{/if}
