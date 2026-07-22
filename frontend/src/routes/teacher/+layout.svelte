<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import { teacherNavGroups } from "$lib/config/navigation";
  import { apiFetch } from "$lib/api";
  import { supabase } from "$lib/supabase";
  import type { MeResponse } from "$lib/types/users";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  let loading = $state(true);
  let user = $state<MeResponse["user"] | null>(null);
  let errorMessage = $state("");

  async function handleLogout() {
    await supabase.auth.signOut();
    await goto("/login");
  }

  onMount(async () => {
    loading = true;
    errorMessage = "";

    try {
      const result = await apiFetch<MeResponse>("/me");

      if (result.user.role !== "TEACHER") {
        await goto("/login");
        return;
      }

      user = result.user;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat akun guru.";
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <main class="flex min-h-screen items-center justify-center bg-slate-50">
    <p class="text-sm font-semibold text-slate-500">Memuat guru...</p>
  </main>
{:else if errorMessage}
  <main class="flex min-h-screen items-center justify-center bg-slate-50 p-6">
    <div
      class="max-w-md rounded-2xl border border-red-100 bg-white p-6 shadow-sm"
    >
      <p class="text-sm font-bold text-red-600">{errorMessage}</p>

      <button
        type="button"
        onclick={() => goto("/login")}
        class="mt-4 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white"
      >
        Kembali ke Login
      </button>
    </div>
  </main>
{:else if user}
  <AppShell
    {user}
    panelLabel="TEACHER PANEL"
    navGroups={teacherNavGroups}
    onLogout={handleLogout}
  >
    {@render children()}
  </AppShell>
{/if}
