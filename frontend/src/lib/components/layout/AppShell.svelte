<script lang="ts">
  import { page } from "$app/state";
  import { setContext, type Snippet } from "svelte";
  import type { AppUser } from "$lib/auth";
  import type { AppNavGroup, AppNavItem } from "$lib/types/navigation";
  import Sidebar from "./Sidebar.svelte";
  import Topbar from "./Topbar.svelte";

  type Props = {
    user: AppUser;
    appName?: string;
    panelLabel: string;
    navGroups: AppNavGroup[];
    version?: string;
    onLogout: () => void | Promise<void>;
    children: Snippet;
  };

  let {
    user,
    appName = "EduTryout",
    panelLabel,
    navGroups,
    version = "v2.4.1",
    onLogout,
    children,
  }: Props = $props();

  let sidebarOpen = $state(false);

  setContext<() => AppUser>("appUser", () => user);

  const currentPath = $derived(page.url.pathname);

  const allNavItems = $derived(navGroups.flatMap((group) => group.items));

  const activeItem = $derived.by<AppNavItem | undefined>(() => {
    const sortedItems = [...allNavItems].sort(
      (a, b) => b.href.length - a.href.length,
    );

    return sortedItems.find((item) => {
      return (
        currentPath === item.href || currentPath.startsWith(`${item.href}/`)
      );
    });
  });

  const activeHref = $derived(activeItem?.href ?? "");
  const title = $derived(activeItem?.label ?? "Halaman Tidak Tersedia");

  const homeHref = $derived(
    panelLabel.toUpperCase().includes("ADMIN") ? "/admin" : "/student",
  );

  const breadcrumbs = $derived([
    {
      label: "Beranda",
      href: homeHref,
    },
    {
      label: title,
    },
  ]);

  $effect(() => {
    currentPath;
    sidebarOpen = false;
  });
</script>

<div class="min-h-screen bg-slate-50 text-slate-900">
  {#if sidebarOpen}
    <button
      type="button"
      aria-label="Tutup menu"
      class="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
      onclick={() => (sidebarOpen = false)}
    ></button>
  {/if}

  <Sidebar
    {user}
    {appName}
    {panelLabel}
    {navGroups}
    {activeHref}
    {onLogout}
    mobileOpen={sidebarOpen}
    onCloseMobile={() => (sidebarOpen = false)}
  />

  <div class="min-h-screen lg:pl-[280px]">
    <Topbar
      {title}
      {breadcrumbs}
      {version}
      onOpenSidebar={() => (sidebarOpen = true)}
    />

    <main class="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      {@render children()}
    </main>
  </div>
</div>
