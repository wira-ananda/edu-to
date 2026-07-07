<script lang="ts">
  import { getContext } from "svelte";
  import type { AppUser } from "$lib/auth";

  const getAppUser = getContext<() => AppUser>("appUser");
  const user = $derived(getAppUser());
</script>

<section class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
  <h2 class="text-2xl font-bold text-slate-950">Profil Siswa</h2>

  <div class="mt-6 grid gap-4 md:grid-cols-2">
    <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p class="text-sm font-semibold text-slate-500">Nama</p>
      <p class="mt-1 font-bold text-slate-900">{user.name}</p>
    </div>

    <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p class="text-sm font-semibold text-slate-500">Email</p>
      <p class="mt-1 font-bold text-slate-900">{user.email}</p>
    </div>

    <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p class="text-sm font-semibold text-slate-500">Sekolah</p>
      <p class="mt-1 font-bold text-slate-900">{user.school ?? "-"}</p>
    </div>

    <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p class="text-sm font-semibold text-slate-500">Kelas</p>
      <p class="mt-1 font-bold text-slate-900">{user.className ?? "-"}</p>
    </div>
  </div>
</section>
