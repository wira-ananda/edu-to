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
</script>

<div class="min-h-screen bg-slate-50 text-slate-900">
  <Sidebar {user} {appName} {panelLabel} {navGroups} {activeHref} {onLogout} />

  <div class="min-h-screen pl-[280px]">
    <Topbar {title} {breadcrumbs} {version} />

    <main class="px-8 py-7">
      {@render children()}
    </main>
  </div>
</div>
