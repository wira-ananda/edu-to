<script module lang="ts">
  let verifiedTeacherUserId: string | null = null;
</script>

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
  import { teacherNavGroups } from "$lib/config/navigation";

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

      if (currentUser.role !== "TEACHER") {
        await goto("/student");
        return;
      }

      if (verifiedTeacherUserId !== currentUser.id) {
        await apiFetch("/teacher/check");
        verifiedTeacherUserId = currentUser.id;
      }

      user = currentUser;
    } catch {
      verifiedTeacherUserId = null;
      await goto("/login");
    } finally {
      loading = false;
    }
  });

  async function handleLogout() {
    verifiedTeacherUserId = null;

    await logoutAuth();
    await goto("/login");
  }
</script>

{#if loading}
  <main class="flex min-h-screen items-center justify-center bg-slate-50">
    <p class="text-sm font-semibold text-slate-500">Memuat guru...</p>
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
