<script lang="ts">
  import { goto } from "$app/navigation";
  import { apiFetch } from "$lib/api";
  import type {
    CreateTeacherPayload,
    MutateTeacherResponse,
  } from "$lib/types/users";

  let name = $state("");
  let email = $state("");
  let school = $state("");
  let password = $state("");
  let confirmPassword = $state("");

  let loading = $state(false);
  let errorMessage = $state("");

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

      await goto("/admin/users");
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal membuat akun guru.";
    } finally {
      loading = false;
    }
  }
</script>

<section class="space-y-5">
  <div>
    <button
      type="button"
      onclick={() => goto("/admin/users")}
      class="mb-3 text-sm font-bold text-blue-900"
    >
      ← Kembali ke Akun Guru
    </button>

    <h2 class="text-2xl font-bold text-slate-950">Tambah Akun Guru</h2>
    <p class="mt-1 text-sm text-slate-500">
      Akun guru dibuat melalui Supabase Auth dan disimpan sebagai role ADMIN.
    </p>
  </div>

  <form
    class="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    onsubmit={handleSubmit}
  >
    {#if errorMessage}
      <p
        class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
      >
        {errorMessage}
      </p>
    {/if}

    <div>
      <label for="name" class="text-sm font-bold text-slate-700">
        Nama Guru
      </label>

      <input
        id="name"
        type="text"
        bind:value={name}
        placeholder="Contoh: Andi Pratama"
        class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
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
        class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
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
        class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
      />
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <label for="password" class="text-sm font-bold text-slate-700">
          Password
        </label>

        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="Minimal 8 karakter"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
        />
      </div>

      <div>
        <label for="confirmPassword" class="text-sm font-bold text-slate-700">
          Konfirmasi Password
        </label>

        <input
          id="confirmPassword"
          type="password"
          bind:value={confirmPassword}
          placeholder="Ulangi password"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-900 focus:bg-white"
        />
      </div>
    </div>

    <div
      class="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700"
    >
      Akun ini akan memiliki akses guru/admin untuk mengelola bank soal, membuat
      tryout, dan melihat hasil evaluasi siswa.
    </div>

    <div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
      <button
        type="button"
        onclick={() => goto("/admin/users")}
        class="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700"
      >
        Batal
      </button>

      <button
        type="submit"
        disabled={loading}
        class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {loading ? "Menyimpan..." : "Simpan Guru"}
      </button>
    </div>
  </form>
</section>
