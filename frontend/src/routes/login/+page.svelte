<script lang="ts">
  import { goto } from "$app/navigation";
  import { supabase } from "$lib/supabase";
  import { apiFetch } from "$lib/api";
  import type { AppUser } from "$lib/auth";

  type MeResponse = {
    ok: boolean;
    user: AppUser;
  };

  let email = $state("student@test.com");
  let password = $state("password123");
  let loading = $state(false);
  let errorMessage = $state("");

  async function handleLogin(event: SubmitEvent) {
    event.preventDefault();

    loading = true;
    errorMessage = "";

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session) {
        throw new Error("Session tidak ditemukan.");
      }

      const result = await apiFetch<MeResponse>("/me");

      if (result.user.role === "ADMIN") {
        await goto("/admin");
        return;
      }

      await goto("/student");
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Login gagal.";
    } finally {
      loading = false;
    }
  }
</script>

<main class="flex min-h-screen items-center justify-center bg-slate-50">
  <section
    class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
  >
    <h1 class="text-2xl font-bold text-slate-900">EduTryout</h1>
    <p class="mt-1 text-sm text-slate-500">Login aplikasi tryout</p>

    <form class="mt-6 space-y-4" onsubmit={handleLogin}>
      <div>
        <label for="email" class="text-sm font-medium text-slate-700">
          Email
        </label>

        <input
          id="email"
          type="email"
          bind:value={email}
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
        />
      </div>

      <div>
        <label for="password" class="text-sm font-medium text-slate-700">
          Password
        </label>

        <input
          id="password"
          type="password"
          bind:value={password}
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
        />
      </div>

      {#if errorMessage}
        <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {errorMessage}
        </p>
      {/if}

      <button
        type="submit"
        disabled={loading}
        class="w-full rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Memproses..." : "Login"}
      </button>
    </form>

    <p class="mt-5 text-center text-sm text-slate-600">
      Belum punya akun?
      <a href="/register" class="font-semibold text-blue-900"
        >Daftar sebagai siswa</a
      >
    </p>

    <div class="mt-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
      <p>Admin: admin@test.com / password123</p>
      <p>Siswa: student@test.com / password123</p>
    </div>
  </section>
</main>
