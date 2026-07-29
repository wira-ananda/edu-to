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
  import { adminNavGroups } from "$lib/config/navigation";

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

      if (currentUser.role !== "ADMIN") {
        await goto("/student");
        return;
      }

      await apiFetch("/admin/check");

      user = currentUser;
    } catch {
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
  <main class="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
    <div class="text-center">
      <div
        class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#0d438d]"
      ></div>

      <p class="mt-4 text-sm font-semibold text-slate-500">
        Memuat panel admin...
      </p>
    </div>
  </main>
{:else if user}
  <AppShell
    {user}
    panelLabel="ADMIN PANEL"
    navGroups={adminNavGroups}
    onLogout={handleLogout}
  >
    {@render children()}
  </AppShell>
{/if}
