import type { AppNavGroup } from "$lib/types/navigation";

export const adminNavGroups: AppNavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: "dashboard",
      },
    ],
  },
  {
    title: "Manajemen Soal",
    items: [
      {
        label: "Bank Soal",
        href: "/admin/questions",
        icon: "book-open",
      },
    ],
  },
  {
    title: "Manajemen Tryout",
    items: [
      {
        label: "Daftar Tryout",
        href: "/admin/tryouts",
        icon: "file-text",
      },
      {
        label: "Buat Tryout",
        href: "/admin/tryouts/new",
        icon: "plus-circle",
      },
    ],
  },
  // {
  //   title: "Evaluasi & Log",
  //   items: [
  //     {
  //       label: "WRS Logs",
  //       href: "/admin/wrs-logs",
  //       icon: "activity",
  //     },
  //     {
  //       label: "Laporan Tryout",
  //       href: "/admin/reports",
  //       icon: "file-text",
  //     },
  //   ],
  // },
  {
    title: "Sistem",
    items: [
      {
        label: "Pengaturan",
        href: "/admin/settings",
        icon: "settings",
      },
    ],
  },
];

export const studentNavGroups: AppNavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/student",
        icon: "dashboard",
      },
    ],
  },
  {
    title: "Tryout",
    items: [
      {
        label: "Mulai Tryout",
        href: "/student/tryouts",
        icon: "play-circle",
      },
      {
        label: "Riwayat Tryout",
        href: "/student/history",
        icon: "history",
      },
      {
        label: "Hasil Belajar",
        href: "/student/results",
        icon: "trophy",
      },
    ],
  },
  {
    title: "Akun",
    items: [
      {
        label: "Profil",
        href: "/student/profile",
        icon: "user",
      },
    ],
  },
];
