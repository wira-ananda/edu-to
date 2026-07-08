<script lang="ts">
  import type { AppUser } from "$lib/auth";
  import type { AppNavGroup } from "$lib/types/navigation";
  import NavIcon from "./NavIcon.svelte";

  type Props = {
    user: AppUser;
    appName?: string;
    panelLabel: string;
    navGroups: AppNavGroup[];
    activeHref: string;
    mobileOpen?: boolean;
    onLogout: () => void | Promise<void>;
    onCloseMobile?: () => void;
  };

  let {
    user,
    appName = "EduTryout",
    panelLabel,
    navGroups,
    activeHref,
    mobileOpen = false,
    onLogout,
    onCloseMobile,
  }: Props = $props();

  const initials = $derived.by(() => {
    const words = user.name.trim().split(" ").filter(Boolean).slice(0, 2);

    if (words.length === 0) return "U";

    return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
  });

  function isActive(href: string) {
    return activeHref === href;
  }
</script>

<aside
  class={`fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[82vw] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 lg:translate-x-0 lg:shadow-none ${
    mobileOpen ? "translate-x-0" : "-translate-x-full"
  }`}
>
  <div
    class="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 px-5"
  >
    <a
      href={panelLabel.toUpperCase().includes("ADMIN") ? "/admin" : "/student"}
      class="flex min-w-0 items-center gap-3"
      onclick={() => onCloseMobile?.()}
    >
      <div
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-900 text-white"
      >
        <svg
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
          <path d="M5 10v5c0 2 3.5 4 7 4s7-2 7-4v-5" />
        </svg>
      </div>

      <div class="min-w-0">
        <p class="truncate text-base font-bold leading-tight text-slate-950">
          {appName}
        </p>

        <p
          class="truncate text-xs font-bold uppercase tracking-wide text-slate-500"
        >
          {panelLabel}
        </p>
      </div>
    </a>

    <button
      type="button"
      aria-label="Tutup menu"
      class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 lg:hidden"
      onclick={() => onCloseMobile?.()}
    >
      <svg
        class="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </svg>
    </button>
  </div>

  <nav class="min-h-0 flex-1 overflow-y-auto px-4 py-5">
    <div class="space-y-7">
      {#each navGroups as group}
        <section>
          <p
            class="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400"
          >
            {group.label}
          </p>

          <div class="space-y-1">
            {#each group.items as item}
              <a
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                onclick={() => onCloseMobile?.()}
                class={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-900 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <NavIcon name={item.icon} />

                <span class="truncate">{item.label}</span>
              </a>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  </nav>

  <div class="shrink-0 border-t border-slate-200 p-4">
    <div class="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white"
      >
        {initials}
      </div>

      <div class="min-w-0">
        <p class="truncate text-sm font-bold text-slate-950">
          {user.name}
        </p>

        <p class="truncate text-xs font-medium text-slate-500">
          {user.email}
        </p>
      </div>
    </div>

    <button
      type="button"
      onclick={() => onLogout()}
      class="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
    >
      Logout
    </button>
  </div>
</aside>
