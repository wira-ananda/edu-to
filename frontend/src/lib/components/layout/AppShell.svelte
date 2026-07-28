<script lang="ts">
  import type { Snippet } from "svelte";

  import type { AppUser } from "$lib/auth";
  import type { AppNavGroup } from "$lib/types/navigation";

  import AppHeader from "./AppHeader.svelte";
  import AppSidebar from "./AppSidebar.svelte";

  type BreadcrumbItem = {
    label: string;
    href?: string;
  };

  type Props = {
    user: AppUser;

    panelLabel: string;

    navGroups: AppNavGroup[];

    activeHref: string;

    title: string;

    breadcrumbs: BreadcrumbItem[];

    focusMode?: boolean;

    onLogout: () => void | Promise<void>;

    children: Snippet;
  };

  let {
    user,
    panelLabel,
    navGroups,
    activeHref,
    title,
    breadcrumbs,
    focusMode = false,
    onLogout,
    children,
  }: Props = $props();

  let mobileOpen = $state(false);

  function openSidebar() {
    if (focusMode) {
      return;
    }

    mobileOpen = true;
  }

  function closeSidebar() {
    mobileOpen = false;
  }
</script>

<div class="min-h-screen bg-[#f7f9fc]">
  {#if !focusMode}
    <AppSidebar
      {user}
      {panelLabel}
      {navGroups}
      {activeHref}
      {mobileOpen}
      {onLogout}
      onCloseMobile={closeSidebar}
    />

    {#if mobileOpen}
      <button
        type="button"
        aria-label="Tutup menu"
        onclick={closeSidebar}
        class="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
      ></button>
    {/if}
  {/if}

  <div
    class={`min-h-screen transition-[padding] ${
      focusMode ? "" : "lg:pl-[260px]"
    }`}
  >
    <AppHeader {title} {breadcrumbs} {focusMode} onOpenSidebar={openSidebar} />

    <main class="w-full py-6 sm:py-7">
      <div
        class={`mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 ${
          focusMode ? "max-w-[1440px]" : "max-w-[1520px]"
        }`}
      >
        {@render children()}
      </div>
    </main>
  </div>
</div>
