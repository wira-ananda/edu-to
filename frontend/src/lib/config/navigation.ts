import type { AppNavGroup } from "$lib/types/navigation";

export const adminNavGroups: AppNavGroup[] = [
  {
    label: "Utama",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: "dashboard",
      },
    ],
  },
  {
    label: "Pembelajaran",
    items: [
      {
        label: "Bank Soal",
        href: "/admin/questions",
        icon: "book-open",
      },
      {
        label: "Tryout",
        href: "/admin/tryouts",
        icon: "file-text",
      },
    ],
  },
  {
    label: "Pengguna",
    items: [
      {
        label: "Guru",
        href: "/admin/users",
        icon: "user",
      },
    ],
  },
  {
    label: "Akun",
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
    label: "Utama",
    items: [
      {
        label: "Dashboard",
        href: "/teacher",
        icon: "dashboard",
      },
    ],
  },
  {
    label: "Pembelajaran",
    items: [
      {
        label: "Bank Soal",
        href: "/teacher/questions",
        icon: "book-open",
      },
      {
        label: "Tryout",
        href: "/teacher/tryouts",
        icon: "file-text",
      },
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
    label: "Utama",
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
        label: "Riwayat",
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
