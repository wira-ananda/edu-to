import type { AppNavGroup } from "$lib/types/navigation";

export const adminNavGroups: AppNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: "dashboard",
      },
    ],
  },
  {
    label: "Manajemen Soal",
    items: [
      {
        label: "Bank Soal",
        href: "/admin/questions",
        icon: "book-open",
      },
    ],
  },
  {
    label: "Manajemen Tryout",
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
  {
    label: "Manajemen Guru",
    items: [
      {
        label: "Daftar Guru",
        href: "/admin/users",
        icon: "user",
      },
      {
        label: "Buat Guru",
        href: "/admin/users/new",
        icon: "plus-circle",
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        label: "Pengaturan",
        href: "/admin/settings",
        icon: "settings",
      },
    ],
  },
];

export const teacherNavGroups: AppNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/teacher",
        icon: "dashboard",
      },
    ],
  },
  {
    label: "Manajemen Soal",
    items: [
      {
        label: "Bank Soal",
        href: "/teacher/questions",
        icon: "book-open",
      },
    ],
  },
  {
    label: "Manajemen Tryout",
    items: [
      {
        label: "Daftar Tryout",
        href: "/teacher/tryouts",
        icon: "file-text",
      },
      {
        label: "Buat Tryout",
        href: "/teacher/tryouts/new",
        icon: "plus-circle",
      },
    ],
  },
  {
    label: "Analitik",
    items: [
      {
        label: "Hasil Siswa",
        href: "/teacher/results",
        icon: "trophy",
      },
    ],
  },
  {
    label: "Akun",
    items: [
      {
        label: "Profil",
        href: "/teacher/profile",
        icon: "user",
      },
    ],
  },
];

export const studentNavGroups: AppNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/student",
        icon: "dashboard",
      },
    ],
  },
  {
    label: "Tryout",
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
    label: "Akun",
    items: [
      {
        label: "Profil",
        href: "/student/profile",
        icon: "user",
      },
    ],
  },
];
