<script lang="ts">
  import { goto } from "$app/navigation";
  import { getContext } from "svelte";
  import type { AppUser } from "$lib/auth";

  const getAppUser = getContext<() => AppUser>("appUser");
  const user = $derived(getAppUser());
</script>

<section class="space-y-6">
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 class="text-2xl font-bold text-slate-950">Dashboard Siswa</h2>

    <p class="mt-2 text-sm leading-6 text-slate-600">
      Selamat datang,
      <span class="font-bold text-slate-900">{user.name}</span>. Kamu dapat
      memulai tryout dan melihat hasil belajar dari halaman ini.
    </p>

    <div class="mt-6 grid gap-4 md:grid-cols-3">
      <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p class="text-sm font-semibold text-slate-500">Sekolah</p>
        <p class="mt-2 text-lg font-bold text-slate-950">
          {user.school ?? "-"}
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p class="text-sm font-semibold text-slate-500">Kelas</p>
        <p class="mt-2 text-lg font-bold text-slate-950">
          {user.className ?? "-"}
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p class="text-sm font-semibold text-slate-500">Role</p>
        <p class="mt-2 text-lg font-bold text-slate-950">
          {user.role}
        </p>
      </div>
    </div>

    <div class="mt-6">
      <button
        type="button"
        onclick={() => goto("/student/tryouts")}
        class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white"
      >
        Mulai Tryout
      </button>
    </div>
  </div>
</section>
