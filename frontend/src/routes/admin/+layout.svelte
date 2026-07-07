<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import {
    getCurrentUser,
    logout as logoutAuth,
    type AppUser,
  } from "$lib/auth";
  import { apiFetch } from "$lib/api";

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

      await apiFetch("/admin/check");

      if (currentUser.role !== "ADMIN") {
        await goto("/student");
        return;
      }

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
  <main class="flex min-h-screen items-center justify-center bg-slate-50">
    <p class="text-slate-600">Memuat admin...</p>
  </main>
{:else if user}
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-7xl items-center justify-between px-8 py-4"
      >
        <div>
          <h1 class="text-xl font-bold text-blue-900">EduTryout Admin</h1>
          <p class="text-sm text-slate-500">{user.name}</p>
        </div>

        <nav class="flex items-center gap-3 text-sm">
          <a href="/admin" class="font-semibold text-slate-700">Dashboard</a>
          <a href="/admin/questions" class="font-semibold text-slate-700"
            >Bank Soal</a
          >
          <a href="/admin/questions/new" class="font-semibold text-slate-700"
            >Tambah Soal</a
          >

          <button
            type="button"
            onclick={handleLogout}
            class="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>

    {@render children()}
  </div>
{/if}
