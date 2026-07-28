<script lang="ts">
  import type { AppUser } from "$lib/auth";

  type Props = {
    user: AppUser;
    eyebrow?: string;
    title?: string;
    description?: string;
    roleLabel?: string;
  };

  let {
    user,
    eyebrow = "Akun",
    title = "Profil",
    description = "Informasi akun yang digunakan pada sistem.",
    roleLabel,
  }: Props = $props();

  function getInitials(name: string) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }

  function getRoleLabel(role: AppUser["role"]) {
    if (role === "ADMIN") {
      return "Administrator";
    }

    if (role === "TEACHER") {
      return "Guru";
    }

    return "Siswa";
  }

  const initials = $derived(getInitials(user.name));

  const displayRole = $derived(roleLabel ?? getRoleLabel(user.role));
</script>

<section class="space-y-5">
  <div>
    <p
      class="text-[10px] font-black uppercase tracking-[0.18em] text-[#0c438c]"
    >
      {eyebrow}
    </p>

    <h2
      class="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
    >
      {title}
    </h2>

    <p class="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
      {description}
    </p>
  </div>

  <div
    class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
  >
    <div class="h-1.5 bg-[#f8c900]"></div>

    <div class="grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <!-- Identity -->
      <aside
        class="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6 lg:border-b-0 lg:border-r"
      >
        <div
          class="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-5"
        >
          <div
            class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#062b63] text-xl font-black tracking-wide text-white shadow-sm sm:h-20 sm:w-20 sm:text-2xl"
          >
            {initials}
          </div>

          <div class="min-w-0">
            <span
              class="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#0c438c]"
            >
              {displayRole}
            </span>

            <h3
              class="mt-2 truncate text-lg font-black text-slate-950 sm:text-xl lg:whitespace-normal"
            >
              {user.name}
            </h3>

            <p class="mt-1 break-all text-sm text-slate-500">
              {user.email}
            </p>
          </div>
        </div>

        <div
          class="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#0c438c]"
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
              <p class="text-xs font-bold text-[#062b63]">Informasi akun</p>

              <p class="mt-1 text-xs leading-5 text-slate-500">
                Data profil digunakan untuk identitas kamu selama menggunakan
                EduTryout.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Details -->
      <div class="p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-base font-black text-slate-950">Informasi Pribadi</p>

            <p class="mt-1 text-xs leading-5 text-slate-500">
              Data utama yang terhubung dengan akunmu.
            </p>
          </div>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#0c438c] shadow-sm"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </div>

              <div class="min-w-0">
                <p
                  class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
                >
                  Nama Lengkap
                </p>

                <p class="mt-1 truncate text-sm font-black text-slate-900">
                  {user.name}
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#0c438c] shadow-sm"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>

              <div class="min-w-0">
                <p
                  class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
                >
                  Email
                </p>

                <p class="mt-1 break-all text-sm font-black text-slate-900">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#0c438c] shadow-sm"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M3 21h18" />
                  <path d="M5 21V9l7-5 7 5v12" />
                  <path d="M9 21v-6h6v6" />
                </svg>
              </div>

              <div class="min-w-0">
                <p
                  class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
                >
                  Sekolah
                </p>

                <p class="mt-1 text-sm font-black text-slate-900">
                  {user.school ?? "Belum diisi"}
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#0c438c] shadow-sm"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M4 5h16v14H4z" />
                  <path d="M8 9h8" />
                  <path d="M8 13h5" />
                </svg>
              </div>

              <div class="min-w-0">
                <p
                  class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
                >
                  Kelas
                </p>

                <p class="mt-1 text-sm font-black text-slate-900">
                  {user.className ?? "Belum diisi"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          class="mt-5 flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3"
        >
          <div
            class="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
          ></div>

          <div>
            <p class="text-xs font-bold text-slate-700">Akun aktif</p>

            <p class="mt-0.5 text-xs leading-5 text-slate-400">
              Kamu sedang login sebagai {displayRole.toLowerCase()}.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
