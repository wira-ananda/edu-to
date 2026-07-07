<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import {
    getCurrentUser,
    logout as logoutAuth,
    type AppUser,
  } from "$lib/auth";
  import { apiFetch } from "$lib/api";

  let loading = $state(true);
  let user: AppUser | null = $state(null);

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

<main class="min-h-screen bg-slate-50 p-8">
  <section class="mx-auto max-w-5xl">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {#if loading}
        <p class="text-slate-600">Memuat...</p>
      {:else if user}
        <h1 class="text-2xl font-bold text-slate-900">Dashboard Admin</h1>

        <p class="mt-2 text-slate-600">
          Login sebagai {user.name} ({user.email})
        </p>

        <p class="mt-1 text-sm font-semibold text-blue-900">
          Role: {user.role}
        </p>

        <button
          type="button"
          onclick={handleLogout}
          class="mt-6 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
        >
          Logout
        </button>
      {/if}
    </div>
  </section>
</main>
