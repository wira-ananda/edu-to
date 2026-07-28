<script lang="ts">
  import RoleDashboard from "$lib/components/dashboard/RoleDashboard.svelte";
  import type { DashboardAction, DashboardCard } from "$lib/types/dashboard";

  const cards: DashboardCard[] = [
    {
      label: "Difficulty",
      value: "Otomatis",
      description:
        "Sistem membaca teks soal dan indikator untuk menentukan tingkat kesulitan.",
      tone: "blue",
    },
    {
      label: "Prioritas",
      value: "Dipilih Admin",
      description:
        "Prioritas soal dapat diatur rendah, normal, tinggi, atau sangat tinggi.",
      tone: "yellow",
    },
    {
      label: "Bobot WRS",
      value: "Dihitung Sistem",
      description:
        "Bobot digunakan untuk menentukan peluang kemunculan soal pada tryout.",
      tone: "green",
    },
  ];

  const actions: DashboardAction[] = [
    {
      title: "Kelola Bank Soal",
      description:
        "Lihat seluruh bank soal, soal, tingkat kesulitan, dan prioritas.",
      href: "/admin/questions",
      label: "Lihat Bank Soal",
      primary: true,
    },
    {
      title: "Kelola Tryout",
      description:
        "Buat dan kelola paket tryout yang dapat dikerjakan oleh siswa.",
      href: "/admin/tryouts",
      label: "Lihat Tryout",
    },
    {
      title: "Kelola Guru",
      description: "Kelola akun guru yang memiliki akses ke sistem EduTryout.",
      href: "/admin/users",
      label: "Lihat Guru",
    },
  ];
</script>

<RoleDashboard
  title="Dashboard Admin"
  description="Kelola bank soal, klasifikasi tingkat kesulitan, prioritas soal, tryout, serta pengguna dalam satu tempat."
  {cards}
  {actions}
/>
