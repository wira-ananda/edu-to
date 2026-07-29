<script lang="ts">
  import RoleDashboard from "$lib/components/dashboard/RoleDashboard.svelte";

  import type { DashboardAction, DashboardCard } from "$lib/types/dashboard";

  const cards: DashboardCard[] = [
    {
      label: "Tingkat Kesulitan",
      value: "Otomatis",
      description:
        "Tingkat kesulitan soal ditentukan sistem berdasarkan karakteristik teks soal.",
      tone: "blue",
    },
    {
      label: "Prioritas Soal",
      value: "Diatur Pengelola",
      description:
        "Prioritas menentukan bobot soal yang digunakan pada proses pemilihan WRS.",
      tone: "yellow",
    },
    {
      label: "Pemilihan Soal",
      value: "WRS",
      description:
        "Weighted Random Sampling memilih soal secara acak berdasarkan bobot kandidat.",
      tone: "green",
    },
  ];

  const actions: DashboardAction[] = [
    {
      title: "Bank Soal",
      description:
        "Kelola mata pelajaran, soal, tingkat kesulitan, dan prioritas soal.",
      href: "/admin/questions",
      label: "Kelola Bank Soal",
      primary: true,
    },
    {
      title: "Tryout",
      description:
        "Buat paket tryout, atur jumlah soal, durasi, dan akses peserta.",
      href: "/admin/tryouts",
      label: "Kelola Tryout",
    },
    {
      title: "Akun Guru",
      description:
        "Tambahkan atau kelola guru yang memiliki akses ke panel guru.",
      href: "/admin/users",
      label: "Kelola Guru",
    },
  ];
</script>

<RoleDashboard
  title="Dashboard Admin"
  description="Kelola bank soal, tryout, pengguna, dan konfigurasi pembelajaran dalam satu panel."
  {cards}
  {actions}
/>
