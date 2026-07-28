<script lang="ts">
  import { getContext } from "svelte";
  import type { AppUser } from "$lib/auth";
  import RoleDashboard from "$lib/components/dashboard/RoleDashboard.svelte";
  import type { DashboardAction, DashboardCard } from "$lib/types/dashboard";

  const getAppUser = getContext<() => AppUser>("appUser");

  const user = $derived(getAppUser());

  const cards = $derived.by<DashboardCard[]>(() => [
    {
      label: "Sekolah",
      value: user.school ?? "-",
      tone: "blue",
    },
    {
      label: "Kelas",
      value: user.className ?? "-",
      tone: "yellow",
    },
    {
      label: "Status Akun",
      value: "Siswa",
      description: "Akun aktif untuk mengikuti tryout.",
      tone: "green",
    },
  ]);

  const actions: DashboardAction[] = [
    {
      title: "Mulai Tryout",
      description:
        "Lihat tryout yang tersedia, gunakan kode bergabung, dan mulai mengerjakan.",
      href: "/student/tryouts",
      label: "Pilih Tryout",
      primary: true,
    },
    {
      title: "Riwayat Tryout",
      description:
        "Lihat kembali seluruh sesi tryout yang pernah kamu kerjakan.",
      href: "/student/history",
      label: "Lihat Riwayat",
    },
    {
      title: "Hasil Belajar",
      description: "Pantau nilai dan perkembangan hasil pengerjaan tryout.",
      href: "/student/results",
      label: "Lihat Hasil",
    },
  ];
</script>

<RoleDashboard
  title={`Halo, ${user.name}`}
  description="Siap untuk latihan hari ini? Pilih tryout yang tersedia dan pantau perkembangan hasil belajarmu."
  {cards}
  {actions}
/>
