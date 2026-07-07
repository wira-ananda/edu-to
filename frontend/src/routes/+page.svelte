<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { getCurrentUser } from "$lib/auth";

  onMount(async () => {
    const user = await getCurrentUser();

    if (!user) {
      await goto("/login");
      return;
    }

    if (user.role === "ADMIN") {
      await goto("/admin");
      return;
    }

    await goto("/student");
  });
</script>

<main class="flex min-h-screen items-center justify-center bg-slate-50">
  <p class="text-slate-600">Memuat...</p>
</main>
