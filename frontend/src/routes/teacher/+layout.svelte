<script module lang="ts">
  let verifiedTeacherUserId: string | null = null;
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";

  import { onMount, setContext } from "svelte";

  import { apiFetch } from "$lib/api";

  import {
    getCurrentUser,
    getHomePathByRole,
    logout as logoutAuth,
    type AppUser,
  } from "$lib/auth";

  import AppShell from "$lib/components/layout/AppShell.svelte";

  import { teacherNavGroups } from "$lib/config/navigation";

  type BreadcrumbItem = {
    label: string;
    href?: string;
  };

  type PageMeta = {
    title: string;
    activeHref: string;
    breadcrumbs: BreadcrumbItem[];
  };

  let { children } = $props();

  let loading = $state(true);
  let user = $state<AppUser | null>(null);
  let authError = $state("");

  /*
   * Child route teacher bisa mengambil user melalui:
   *
   * const getAppUser =
   *   getContext<() => AppUser | null>("appUser");
   */
  setContext("appUser", () => user);

  function getPageMeta(pathname: string): PageMeta {
    /*
     * Dashboard
     */
    if (pathname === "/teacher" || pathname === "/teacher/") {
      return {
        title: "Dashboard",
        activeHref: "/teacher",

        breadcrumbs: [
          {
            label: "Beranda",
          },
        ],
      };
    }

    /*
     * Bank Soal
     *
     * Nested route juga tetap dianggap Bank Soal.
     */
    if (pathname.startsWith("/teacher/questions")) {
      return {
        title: "Bank Soal",
        activeHref: "/teacher/questions",

        breadcrumbs: [
          {
            label: "Beranda",
            href: "/teacher",
          },
          {
            label: "Bank Soal",
          },
        ],
      };
    }

    /*
     * Tryout
     */
    if (pathname.startsWith("/teacher/tryouts")) {
      return {
        title: "Kelola Tryout",
        activeHref: "/teacher/tryouts",

        breadcrumbs: [
          {
            label: "Beranda",
            href: "/teacher",
          },
          {
            label: "Kelola Tryout",
          },
        ],
      };
    }

    /*
     * Peserta
     */
    if (pathname.startsWith("/teacher/participants")) {
      return {
        title: "Peserta",
        activeHref: "/teacher/participants",

        breadcrumbs: [
          {
            label: "Beranda",
            href: "/teacher",
          },
          {
            label: "Peserta",
          },
        ],
      };
    }

    /*
     * Hasil
     */
    if (pathname.startsWith("/teacher/results")) {
      return {
        title: "Hasil Tryout",
        activeHref: "/teacher/results",

        breadcrumbs: [
          {
            label: "Beranda",
            href: "/teacher",
          },
          {
            label: "Hasil Tryout",
          },
        ],
      };
    }

    /*
     * Profile
     */
    if (pathname.startsWith("/teacher/profile")) {
      return {
        title: "Profil",
        activeHref: "/teacher/profile",

        breadcrumbs: [
          {
            label: "Beranda",
            href: "/teacher",
          },
          {
            label: "Profil",
          },
        ],
      };
    }

    /*
     * Fallback.
     *
     * Supaya activeHref tidak pernah undefined.
     */
    return {
      title: "Teacher Panel",
      activeHref: "/teacher",

      breadcrumbs: [
        {
          label: "Beranda",
          href: "/teacher",
        },
      ],
    };
  }

  const pageMeta = $derived(getPageMeta(page.url.pathname));

  async function loadUser() {
    loading = true;
    authError = "";

    try {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        await goto("/login", {
          replaceState: true,
        });

        return;
      }

      if (currentUser.role !== "TEACHER") {
        await goto(getHomePathByRole(currentUser.role), {
          replaceState: true,
        });

        return;
      }

      /*
       * Teacher check cukup sekali per user
       * selama module layout masih aktif.
       */
      if (verifiedTeacherUserId !== currentUser.id) {
        await apiFetch("/teacher/check");

        verifiedTeacherUserId = currentUser.id;
      }

      user = currentUser;
    } catch (error) {
      console.error("Failed to load teacher:", error);

      verifiedTeacherUserId = null;

      authError =
        error instanceof Error ? error.message : "Gagal memuat akun guru.";
    } finally {
      loading = false;
    }
  }

  async function handleLogout() {
    verifiedTeacherUserId = null;

    await logoutAuth();

    await goto("/login", {
      replaceState: true,
    });
  }

  onMount(() => {
    void loadUser();
  });
</script>

{#if loading}
  <main class="flex min-h-screen items-center justify-center bg-slate-50">
    <div class="flex flex-col items-center gap-3">
      <div
        class="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#0c438c]"
      ></div>

      <p class="text-sm font-semibold text-slate-500">Memuat guru...</p>
    </div>
  </main>
{:else if authError}
  <main class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div
      class="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm"
    >
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-lg font-black text-red-600"
      >
        !
      </div>

      <h1 class="mt-4 text-lg font-black text-slate-950">
        Gagal Memuat Akun Guru
      </h1>

      <p class="mt-2 text-sm leading-6 text-slate-500">
        {authError}
      </p>

      <div class="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onclick={loadUser}
          class="rounded-xl bg-[#062b63] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0c438c]"
        >
          Coba Lagi
        </button>

        <button
          type="button"
          onclick={handleLogout}
          class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          Login Ulang
        </button>
      </div>
    </div>
  </main>
{:else if user}
  <AppShell
    {user}
    panelLabel="TEACHER PANEL"
    navGroups={teacherNavGroups}
    activeHref={pageMeta.activeHref}
    title={pageMeta.title}
    breadcrumbs={pageMeta.breadcrumbs}
    onLogout={handleLogout}
  >
    {@render children()}
  </AppShell>
{/if}
