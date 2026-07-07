<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import {
    getCurrentUser,
    logout as logoutAuth,
    type AppUser,
  } from "$lib/auth";
  import AppShell from "$lib/components/layout/AppShell.svelte";
  import { studentNavGroups } from "$lib/config/navigation";

  let { children } = $props();

  let loading = $state(true);
  let user = $state<AppUser | null>(null);

  onMount(async () => {
    try {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        await goto("/login");
        return;
      }

      if (currentUser.role !== "STUDENT") {
        await goto("/admin");
        return;
      }

      await apiFetch("/student/check");

      user = currentUser;
    } catch (error) {
      console.error(error);
      await goto("/login");
    } finally {
      loading = false;
    }
  });

  async function handleLogout() {
    await logoutAuth();
    await goto("/login");
  }
</script>

{#if loading}
  <main class="flex min-h-screen items-center justify-center bg-slate-50">
    <p class="text-sm font-semibold text-slate-500">Memuat siswa...</p>
  </main>
{:else if user}
  <AppShell
    {user}
    panelLabel="STUDENT PANEL"
    navGroups={studentNavGroups}
    onLogout={handleLogout}
  >
    {@render children()}
  </AppShell>
{/if}
