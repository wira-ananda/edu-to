<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount, setContext } from "svelte";

  import {
    getCurrentUser,
    getHomePathByRole,
    logout as logoutAuth,
    type AppUser,
  } from "$lib/auth";

  import AppShell from "$lib/components/layout/AppShell.svelte";
  import { studentNavGroups } from "$lib/config/navigation";

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
   * Context sengaja berupa getter function.
   *
   * Saat setContext() dijalankan, user masih null.
   * Dengan getter ini child component selalu membaca
   * nilai user terbaru setelah proses auth selesai.
   */
  setContext("appUser", () => user);

  const isExamMode = $derived(
    /^\/student\/tryouts\/[^/]+\/?$/.test(page.url.pathname),
  );

  function getPageMeta(pathname: string, examMode: boolean): PageMeta {
    if (examMode) {
      return {
        title: "Tryout Berlangsung",
        activeHref: "/student/tryouts",
        breadcrumbs: [
          {
            label: "Tryout",
          },
          {
            label: "Ujian Berlangsung",
          },
        ],
      };
    }

    if (pathname === "/student/tryouts") {
      return {
        title: "Mulai Tryout",
        activeHref: "/student/tryouts",
        breadcrumbs: [
          {
            label: "Beranda",
            href: "/student",
          },
          {
            label: "Mulai Tryout",
          },
        ],
      };
    }

    if (pathname === "/student/history") {
      return {
        title: "Riwayat",
        activeHref: "/student/history",
        breadcrumbs: [
          {
            label: "Beranda",
            href: "/student",
          },
          {
            label: "Riwayat",
          },
        ],
      };
    }

    if (pathname === "/student/results") {
      return {
        title: "Hasil Belajar",
        activeHref: "/student/results",
        breadcrumbs: [
          {
            label: "Beranda",
            href: "/student",
          },
          {
            label: "Hasil Belajar",
          },
        ],
      };
    }

    if (/^\/student\/results\/[^/]+\/?$/.test(pathname)) {
      return {
        title: "Hasil Tryout",
        activeHref: "/student/results",
        breadcrumbs: [
          {
            label: "Beranda",
            href: "/student",
          },
          {
            label: "Hasil Belajar",
            href: "/student/results",
          },
          {
            label: "Detail Hasil",
          },
        ],
      };
    }

    if (pathname === "/student/profile") {
      return {
        title: "Profil",
        activeHref: "/student/profile",
        breadcrumbs: [
          {
            label: "Beranda",
            href: "/student",
          },
          {
            label: "Profil",
          },
        ],
      };
    }

    return {
      title: "Dashboard",
      activeHref: "/student",
      breadcrumbs: [
        {
          label: "Beranda",
        },
      ],
    };
  }

  const pageMeta = $derived(getPageMeta(page.url.pathname, isExamMode));

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

      if (currentUser.role !== "STUDENT") {
        await goto(getHomePathByRole(currentUser.role), {
          replaceState: true,
        });

        return;
      }

      user = currentUser;
    } catch (error) {
      console.error("Failed to load student user:", error);

      authError =
        error instanceof Error ? error.message : "Gagal memuat akun siswa.";
    } finally {
      loading = false;
    }
  }

  async function handleLogout() {
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

      <p class="text-sm font-semibold text-slate-500">Memuat siswa...</p>
    </div>
  </main>
{:else if authError}
  <main class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div
      class="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm"
    >
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 font-black text-red-600"
      >
        !
      </div>

      <h1 class="mt-4 text-lg font-black text-slate-950">Gagal Memuat Akun</h1>

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
    panelLabel="STUDENT PANEL"
    navGroups={studentNavGroups}
    activeHref={pageMeta.activeHref}
    title={pageMeta.title}
    breadcrumbs={pageMeta.breadcrumbs}
    focusMode={isExamMode}
    onLogout={handleLogout}
  >
    {@render children()}
  </AppShell>
{/if}
