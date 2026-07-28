<script lang="ts">
  import { getContext } from "svelte";

  import type { AppUser } from "$lib/auth";

  type DashboardCard = {
    label: string;
    value: string;
    description: string;
  };

  const getAppUser = getContext<(() => AppUser | null) | undefined>("appUser");

  const user = $derived(getAppUser?.() ?? null);

  const cards = $derived<DashboardCard[]>(
    user
      ? [
          {
            label: "Sekolah",
            value: user.school ?? "-",
            description: "Sekolah asal siswa",
          },
          {
            label: "Kelas",
            value: user.className ?? "-",
            description: "Kelas siswa saat ini",
          },
          {
            label: "Status Akun",
            value: "Siswa",
            description: "Peserta EduTryout",
          },
        ]
      : [],
  );
</script>

{#if user}
  <section class="space-y-6">
    <!-- Hero -->
    <section
      class="relative overflow-hidden rounded-2xl bg-[#062b63] text-white shadow-sm"
    >
      <div
        class="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#174aa6]/70"
      ></div>

      <div
        class="pointer-events-none absolute right-24 top-0 hidden h-full w-32 -skew-x-[28deg] bg-[#f8c900] lg:block"
      ></div>

      <div class="relative z-10 px-5 py-7 sm:px-7 sm:py-8 lg:px-8">
        <p
          class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200"
        >
          Dashboard Siswa
        </p>

        <h1
          class="mt-2 max-w-2xl text-2xl font-black tracking-tight sm:text-3xl"
        >
          Selamat datang, {user.name}
        </h1>

        <p
          class="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-[15px]"
        >
          Ikuti tryout, lanjutkan sesi yang masih berjalan, dan pantau
          perkembangan hasil belajarmu melalui EduTryout.
        </p>

        <div class="mt-6 flex flex-wrap gap-3">
          <a
            href="/student/tryouts"
            class="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#062b63] transition hover:bg-blue-50"
          >
            Mulai Tryout

            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>

          <a
            href="/student/history"
            class="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
          >
            Lihat Riwayat
          </a>
        </div>
      </div>

      <div class="h-1.5 bg-[#f8c900]"></div>
    </section>

    <!-- Student info -->
    <section>
      <div class="mb-4">
        <p
          class="text-[10px] font-black uppercase tracking-[0.18em] text-[#0c438c]"
        >
          Informasi Siswa
        </p>

        <h2
          class="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl"
        >
          Profil Singkat
        </h2>

        <p class="mt-1 text-sm text-slate-500">
          Informasi akun yang digunakan selama mengikuti tryout.
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {#each cards as card}
          <article
            class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="absolute left-0 top-0 h-full w-1 bg-[#f8c900]"></div>

            <div class="pl-1">
              <p
                class="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400"
              >
                {card.label}
              </p>

              <p
                class="mt-2 break-words text-xl font-black leading-tight text-slate-950"
              >
                {card.value}
              </p>

              <p class="mt-2 text-xs leading-5 text-slate-500">
                {card.description}
              </p>
            </div>
          </article>
        {/each}
      </div>
    </section>

    <!-- Quick access -->
    <section>
      <div class="mb-4">
        <p
          class="text-[10px] font-black uppercase tracking-[0.18em] text-[#0c438c]"
        >
          Akses Cepat
        </p>

        <h2 class="mt-1 text-xl font-black text-slate-950">
          Mau melakukan apa?
        </h2>
      </div>

      <div
        class="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-3"
      >
        <!-- Tryout -->
        <a
          href="/student/tryouts"
          class="group border-b border-slate-100 p-5 transition hover:bg-blue-50/50 md:border-b-0 md:border-r md:p-6"
        >
          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0c438c] transition group-hover:bg-[#0c438c] group-hover:text-white"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="m10 8 6 4-6 4V8Z" />
            </svg>
          </div>

          <h3 class="mt-4 text-base font-black text-slate-950">Mulai Tryout</h3>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            Pilih tryout yang tersedia atau bergabung langsung menggunakan kode.
          </p>

          <span
            class="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#0c438c]"
          >
            Lihat tryout

            <span class="transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </a>

        <!-- History -->
        <a
          href="/student/history"
          class="group border-b border-slate-100 p-5 transition hover:bg-blue-50/50 md:border-b-0 md:border-r md:p-6"
        >
          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0c438c] transition group-hover:bg-[#0c438c] group-hover:text-white"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
              <path d="M7 4 4 7l3 3" />
            </svg>
          </div>

          <h3 class="mt-4 text-base font-black text-slate-950">
            Riwayat Tryout
          </h3>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            Lihat sesi yang sedang berlangsung maupun pengerjaan yang sudah
            selesai.
          </p>

          <span
            class="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#0c438c]"
          >
            Lihat riwayat

            <span class="transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </a>

        <!-- Results -->
        <a
          href="/student/results"
          class="group p-5 transition hover:bg-blue-50/50 md:p-6"
        >
          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0c438c] transition group-hover:bg-[#0c438c] group-hover:text-white"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M8 20h8" />
              <path d="M12 16v4" />
              <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
              <path d="M7 6H4v2a4 4 0 0 0 4 4" />
              <path d="M17 6h3v2a4 4 0 0 1-4 4" />
            </svg>
          </div>

          <h3 class="mt-4 text-base font-black text-slate-950">
            Hasil Belajar
          </h3>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            Pantau nilai, hasil pengerjaan, dan perkembangan performa tryout.
          </p>

          <span
            class="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#0c438c]"
          >
            Lihat hasil

            <span class="transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </a>
      </div>
    </section>

    <!-- Info -->
    <section
      class="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 sm:px-5"
    >
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#0c438c]"
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
        <p class="text-sm font-black text-[#062b63]">Sistem tryout adaptif</p>

        <p class="mt-1 text-xs leading-5 text-slate-600">
          Tingkat soal dapat menyesuaikan hasil pengerjaanmu. Setiap tryout
          dapat memiliki aturan jumlah soal, durasi, dan batas percobaan yang
          berbeda.
        </p>
      </div>
    </section>
  </section>
{/if}
