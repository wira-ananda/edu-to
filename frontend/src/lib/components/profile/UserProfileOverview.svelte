<script lang="ts">
  import type { AppUser } from "$lib/auth";

  type Props = {
    user: AppUser;
    title?: string;
    description?: string;
    roleLabel?: string;
  };

  let {
    user,
    title = "Profil",
    description = "Informasi akun yang digunakan pada sistem tryout.",
    roleLabel = "Pengguna",
  }: Props = $props();

  const initials = $derived.by(() => {
    const words = user.name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

    if (words.length === 0) {
      return "U";
    }

    return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
  });

  const roleDescription = $derived.by(() => {
    if (user.role === "ADMIN") {
      return "Memiliki akses untuk mengelola keseluruhan sistem.";
    }

    if (user.role === "TEACHER") {
      return "Mengelola bank soal, tryout, peserta, dan hasil siswa.";
    }

    return "Mengikuti tryout dan melihat hasil pengerjaan.";
  });

  const accountStatusLabel = $derived("Aktif");
</script>

<section class="space-y-6">
  <!-- PAGE HEADER -->
  <div>
    <p class="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
      Akun
    </p>

    <h2 class="mt-1 text-2xl font-black tracking-tight text-slate-950">
      {title}
    </h2>

    <p class="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
      {description}
    </p>
  </div>

  <!-- PROFILE HERO -->
  <section
    class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
  >
    <div class="absolute left-0 top-0 h-1.5 w-full bg-[#f8c900]"></div>

    <div class="relative overflow-hidden bg-[#062b63] px-6 py-7 sm:px-8">
      <!-- decorative shapes -->
      <div
        class="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rotate-12 rounded-[48px] bg-[#0c438c]"
      ></div>

      <div
        class="pointer-events-none absolute -right-5 top-0 h-full w-28 skew-x-[-24deg] bg-[#f8c900]"
      ></div>

      <div class="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#f8c900] text-2xl font-black text-[#062b63] shadow-lg"
        >
          {initials}
        </div>

        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="truncate text-2xl font-black tracking-tight text-white">
              {user.name}
            </h3>

            <span
              class="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
            >
              {roleLabel}
            </span>
          </div>

          <p class="mt-1 text-sm font-medium text-blue-100">
            {user.email}
          </p>

          <p class="mt-3 max-w-xl text-sm leading-6 text-blue-100/80">
            {roleDescription}
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- ACCOUNT SUMMARY -->
  <div class="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]">
    <!-- MAIN INFO -->
    <section
      class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div class="border-b border-slate-100 pb-4">
        <p
          class="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
        >
          Informasi Akun
        </p>

        <h3 class="mt-1 text-lg font-black text-slate-950">Data profil</h3>

        <p class="mt-1 text-sm text-slate-500">
          Informasi identitas yang tersimpan pada akun ini.
        </p>
      </div>

      <dl class="divide-y divide-slate-100">
        <div
          class="grid gap-1 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center"
        >
          <dt class="text-sm font-semibold text-slate-500">Nama Lengkap</dt>

          <dd class="text-sm font-bold text-slate-900">
            {user.name}
          </dd>
        </div>

        <div
          class="grid gap-1 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center"
        >
          <dt class="text-sm font-semibold text-slate-500">Email</dt>

          <dd class="break-all text-sm font-bold text-slate-900">
            {user.email}
          </dd>
        </div>

        <div
          class="grid gap-1 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center"
        >
          <dt class="text-sm font-semibold text-slate-500">Role</dt>

          <dd>
            <span
              class="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#123c8c]"
            >
              {roleLabel}
            </span>
          </dd>
        </div>

        {#if user.school}
          <div
            class="grid gap-1 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center"
          >
            <dt class="text-sm font-semibold text-slate-500">Sekolah</dt>

            <dd class="text-sm font-bold text-slate-900">
              {user.school}
            </dd>
          </div>
        {/if}

        {#if user.className}
          <div
            class="grid gap-1 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center"
          >
            <dt class="text-sm font-semibold text-slate-500">Kelas</dt>

            <dd class="text-sm font-bold text-slate-900">
              {user.className}
            </dd>
          </div>
        {/if}
      </dl>
    </section>

    <!-- ACCOUNT STATUS -->
    <div class="space-y-5">
      <section
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <p
          class="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
        >
          Status Akun
        </p>

        <div class="mt-4 flex items-center gap-3">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <div>
            <p class="font-black text-slate-900">
              {accountStatusLabel}
            </p>

            <p class="text-xs text-slate-500">
              Akun dapat digunakan pada sistem.
            </p>
          </div>
        </div>
      </section>

      <section
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <p
          class="text-xs font-black uppercase tracking-[0.14em] text-slate-400"
        >
          Hak Akses
        </p>

        <div class="mt-4 flex items-start gap-3">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#123c8c]"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>

          <div>
            <p class="font-black text-slate-900">
              {roleLabel}
            </p>

            <p class="mt-1 text-xs leading-5 text-slate-500">
              {roleDescription}
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- SECURITY -->
  <section
    class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
  >
    <div class="flex items-start gap-4">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"
      >
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </div>

      <div>
        <h3 class="font-black text-slate-900">Keamanan Akun</h3>

        <p class="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Gunakan akun hanya untuk keperluan sistem tryout dan jangan membagikan
          password kepada pengguna lain.
        </p>
      </div>
    </div>
  </section>
</section>
