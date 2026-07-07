<script lang="ts">
  import { goto } from "$app/navigation";
  import { supabase } from "$lib/supabase";
  import { apiFetch } from "$lib/api";
  import type { AppUser } from "$lib/auth";

  type RegisterResponse = {
    ok: boolean;
    message: string;
    user: AppUser;
  };

  type MeResponse = {
    ok: boolean;
    user: AppUser;
  };

  let name = $state("");
  let email = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let school = $state("SMAN 1 Gowa");
  let className = $state("");
  let loading = $state(false);
  let successMessage = $state("");
  let errorMessage = $state("");

  async function handleRegister(event: SubmitEvent) {
    event.preventDefault();

    loading = true;
    successMessage = "";
    errorMessage = "";

    try {
      if (!name.trim()) {
        throw new Error("Nama wajib diisi.");
      }

      if (!email.trim()) {
        throw new Error("Email wajib diisi.");
      }

      if (password.length < 6) {
        throw new Error("Password minimal 6 karakter.");
      }

      if (password !== confirmPassword) {
        throw new Error("Konfirmasi password tidak sama.");
      }

      await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          name,
          email,
          password,
          school,
          className,
        }),
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session) {
        throw new Error("Session tidak ditemukan setelah register.");
      }

      const result = await apiFetch<MeResponse>("/me");

      if (result.user.role === "STUDENT") {
        await goto("/student");
        return;
      }

      await goto("/login");
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Registrasi gagal.";
    } finally {
      loading = false;
    }
  }
</script>

<main class="flex min-h-screen items-center justify-center bg-slate-50">
  <section
    class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
  >
    <h1 class="text-2xl font-bold text-slate-900">Daftar Akun Siswa</h1>
    <p class="mt-1 text-sm text-slate-500">
      Akun ini digunakan untuk mengikuti tryout.
    </p>

    <form class="mt-6 space-y-4" onsubmit={handleRegister}>
      <div>
        <label for="name" class="text-sm font-medium text-slate-700">
          Nama Lengkap
        </label>

        <input
          id="name"
          type="text"
          bind:value={name}
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
        />
      </div>

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
        <label for="school" class="text-sm font-medium text-slate-700">
          Sekolah
        </label>

        <input
          id="school"
          type="text"
          bind:value={school}
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
        />
      </div>

      <div>
        <label for="className" class="text-sm font-medium text-slate-700">
          Kelas
        </label>

        <input
          id="className"
          type="text"
          bind:value={className}
          placeholder="Contoh: XII IPA 1"
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

      <div>
        <label for="confirmPassword" class="text-sm font-medium text-slate-700">
          Konfirmasi Password
        </label>

        <input
          id="confirmPassword"
          type="password"
          bind:value={confirmPassword}
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
        />
      </div>

      {#if errorMessage}
        <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {errorMessage}
        </p>
      {/if}

      {#if successMessage}
        <p class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
          {successMessage}
        </p>
      {/if}

      <button
        type="submit"
        disabled={loading}
        class="w-full rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Memproses..." : "Daftar"}
      </button>
    </form>

    <p class="mt-5 text-center text-sm text-slate-600">
      Sudah punya akun?
      <a href="/login" class="font-semibold text-blue-900">Login</a>
    </p>
  </section>
</main>
