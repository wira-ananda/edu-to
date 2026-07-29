<script lang="ts">
  import { goto } from "$app/navigation";

  import { apiFetch } from "$lib/api";

  import { invalidateAdminTeacherAccountsCache } from "$lib/cache/admin-page-cache";

  import type {
    CreateTeacherPayload,
    MutateTeacherResponse,
  } from "$lib/types/users";

  let name = $state("");
  let email = $state("");
  let school = $state("");
  let password = $state("");
  let confirmPassword = $state("");

  let showPassword = $state(false);

  let loading = $state(false);
  let errorMessage = $state("");

  const passwordMatches = $derived(
    !confirmPassword || password === confirmPassword,
  );

  const formValid = $derived(
    name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 8 &&
      password === confirmPassword,
  );

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    errorMessage = "";

    if (!name.trim()) {
      errorMessage = "Nama guru wajib diisi.";
      return;
    }

    if (!email.trim()) {
      errorMessage = "Email guru wajib diisi.";
      return;
    }

    if (password.length < 8) {
      errorMessage = "Password minimal 8 karakter.";
      return;
    }

    if (password !== confirmPassword) {
      errorMessage = "Konfirmasi password tidak sama.";
      return;
    }

    loading = true;

    try {
      const payload: CreateTeacherPayload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        school: school.trim() || null,
      };

      await apiFetch<MutateTeacherResponse>("/admin/users/teachers", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      invalidateAdminTeacherAccountsCache();

      await goto("/admin/users");
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal membuat akun guru.";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Tambah Guru | EduTryout</title>
</svelte:head>

<section class="mx-auto max-w-4xl space-y-6">
  <!-- Header -->
  <div>
    <button
      type="button"
      onclick={() => goto("/admin/users")}
      class="inline-flex items-center gap-2 text-sm font-bold text-[#0d438d] transition hover:text-[#062b63]"
    >
      <span aria-hidden="true">←</span>
      Akun Guru
    </button>

    <p
      class="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#0d438d]"
    >
      Pengguna
    </p>

    <h1
      class="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
    >
      Tambah Akun Guru
    </h1>

    <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
      Buat akun baru agar guru dapat mengakses panel guru dan mengelola
      pembelajaran miliknya.
    </p>
  </div>

  {#if errorMessage}
    <div
      class="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </div>
  {/if}

  <form
    class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    onsubmit={handleSubmit}
  >
    <!-- Account information -->
    <div class="border-b border-slate-100 p-5 sm:p-6">
      <h2 class="font-bold text-slate-900">Informasi Guru</h2>

      <p class="mt-1 text-sm text-slate-500">
        Informasi dasar yang akan ditampilkan pada sistem.
      </p>

      <div class="mt-6 grid gap-5 md:grid-cols-2">
        <div class="md:col-span-2">
          <label for="name" class="text-sm font-bold text-slate-700">
            Nama Guru
          </label>

          <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="Contoh: Rahmah Hakim, S.Pd"
            disabled={loading}
            class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0d438d] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
          />
        </div>

        <div>
          <label for="email" class="text-sm font-bold text-slate-700">
            Email
          </label>

          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="guru@example.com"
            disabled={loading}
            class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0d438d] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
          />
        </div>

        <div>
          <label for="school" class="text-sm font-bold text-slate-700">
            Sekolah
          </label>

          <input
            id="school"
            type="text"
            bind:value={school}
            placeholder="Contoh: SMAN 1 Gowa"
            disabled={loading}
            class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0d438d] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
          />
        </div>
      </div>
    </div>

    <!-- Security -->
    <div class="p-5 sm:p-6">
      <h2 class="font-bold text-slate-900">Keamanan Akun</h2>

      <p class="mt-1 text-sm text-slate-500">
        Password digunakan guru saat masuk ke EduTryout.
      </p>

      <div class="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label for="password" class="text-sm font-bold text-slate-700">
            Password
          </label>

          <div class="relative mt-2">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              bind:value={password}
              placeholder="Minimal 8 karakter"
              disabled={loading}
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0d438d] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            />

            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              disabled={loading}
              class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-[#0d438d] transition hover:bg-blue-50 disabled:opacity-60"
            >
              {showPassword ? "Sembunyi" : "Lihat"}
            </button>
          </div>

          <p class="mt-2 text-xs text-slate-400">Gunakan minimal 8 karakter.</p>
        </div>

        <div>
          <label for="confirmPassword" class="text-sm font-bold text-slate-700">
            Konfirmasi Password
          </label>

          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            bind:value={confirmPassword}
            placeholder="Ulangi password"
            disabled={loading}
            class={`mt-2 w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 disabled:opacity-60 ${
              passwordMatches
                ? "border-slate-200 focus:border-[#0d438d] focus:ring-blue-100"
                : "border-red-300 focus:border-red-400 focus:ring-red-100"
            }`}
          />

          {#if !passwordMatches}
            <p class="mt-2 text-xs font-semibold text-red-600">
              Konfirmasi password belum sama.
            </p>
          {/if}
        </div>
      </div>

      <div
        class="mt-6 flex gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4"
      >
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#0d438d]"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" />
            <path d="M12 8h.01" />
          </svg>
        </div>

        <div>
          <p class="text-sm font-bold text-[#0a397c]">Role akun: Teacher</p>

          <p class="mt-1 text-xs leading-5 text-blue-900/70">
            Akun akan dibuat melalui Supabase Auth dan disimpan sebagai pengguna
            dengan role TEACHER.
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"
    >
      <button
        type="button"
        onclick={() => goto("/admin/users")}
        disabled={loading}
        class="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        Batal
      </button>

      <button
        type="submit"
        disabled={loading || !formValid}
        class="rounded-xl bg-[#123b8f] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0d327d] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : "Simpan Guru"}
      </button>
    </div>
  </form>
</section>
