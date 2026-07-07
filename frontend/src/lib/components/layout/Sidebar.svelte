<script lang="ts">
  import type { AppUser } from "$lib/auth";
  import type { AppNavGroup } from "$lib/types/navigation";
  import NavIcon from "./NavIcon.svelte";

  type Props = {
    user: AppUser;
    appName: string;
    panelLabel: string;
    navGroups: AppNavGroup[];
    activeHref: string;
    onLogout: () => void | Promise<void>;
  };

  let { user, appName, panelLabel, navGroups, activeHref, onLogout }: Props =
    $props();

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }
</script>

<aside
  class="fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-slate-200 bg-white"
>
  <div class="flex h-[76px] items-center gap-3 border-b border-slate-200 px-6">
    <div
      class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white"
    >
      <svg
        class="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
      >
        <path d="M4 7.5 12 3l8 4.5-8 4.5z" />
        <path d="M6.5 10v4.5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3V10" />
      </svg>
    </div>

    <div>
      <p class="text-sm font-bold leading-4 text-slate-950">{appName}</p>
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {panelLabel}
      </p>
    </div>
  </div>

  <nav class="flex-1 overflow-y-auto px-3 py-5">
    {#each navGroups as group}
      <div class="mb-7">
        <p
          class="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
        >
          {group.title}
        </p>

        <div class="space-y-1">
          {#each group.items as item}
            {@const active = item.href === activeHref}

            <a
              href={item.href}
              class={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-blue-50 text-blue-900 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <span class="flex items-center gap-3">
                <span class={active ? "text-blue-900" : "text-slate-400"}>
                  <NavIcon name={item.icon} />
                </span>

                <span>{item.label}</span>
              </span>

              {#if item.badge}
                <span
                  class="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white"
                >
                  {item.badge}
                </span>
              {/if}
            </a>
          {/each}
        </div>
      </div>
    {/each}
  </nav>

  <div class="border-t border-slate-200 p-4">
    <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
      <div
        class="flex h-11 w-11 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white"
      >
        {getInitials(user.name)}
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-bold text-slate-900">{user.name}</p>
        <p class="truncate text-xs text-slate-500">{user.email}</p>
      </div>
    </div>

    <button
      type="button"
      onclick={onLogout}
      class="mt-3 w-full rounded-xl border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
    >
      Logout
    </button>
  </div>
</aside>
