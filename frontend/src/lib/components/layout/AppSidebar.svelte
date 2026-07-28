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

    if (words.length === 0) {
      return "U";
    }

    return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
  });

  const homeHref = $derived.by(() => {
    if (user.role === "ADMIN") {
      return "/admin";
    }

    if (user.role === "TEACHER") {
      return "/teacher";
    }

    return "/student";
  });

  function isActive(href: string) {
    if (href === "/admin" || href === "/teacher" || href === "/student") {
      return activeHref === href;
    }

    return activeHref === href || activeHref.startsWith(`${href}/`);
  }
</script>

<aside
  class={`fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[84vw] flex-col overflow-hidden bg-[#062b63] text-white shadow-2xl transition-transform duration-200 lg:translate-x-0 lg:shadow-none ${
    mobileOpen ? "translate-x-0" : "-translate-x-full"
  }`}
>
  <!-- Decoration -->
  <div
    class="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rotate-12 rounded-[40px] bg-[#0c438c]"
  ></div>

  <div
    class="pointer-events-none absolute right-0 top-0 h-24 w-20 bg-[#f8c900]"
    style="clip-path: polygon(100% 0, 100% 100%, 0 0);"
  ></div>

  <!-- Brand -->
  <div
    class="relative z-10 flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-5"
  >
    <a
      href={homeHref}
      class="flex min-w-0 items-center gap-3"
      onclick={() => onCloseMobile?.()}
    >
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f8c900] text-[#062b63] shadow-sm"
      >
        <svg
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.9"
        >
          <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
          <path d="M5 10v5c0 2 3.5 4 7 4s7-2 7-4v-5" />
        </svg>
      </div>

      <div class="min-w-0">
        <p
          class="truncate text-base font-black leading-tight tracking-tight text-white"
        >
          {appName}
        </p>

        <p
          class="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200"
        >
          {panelLabel}
        </p>
      </div>
    </a>

    <button
      type="button"
      aria-label="Tutup menu"
      class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-blue-100 transition hover:bg-white/10 lg:hidden"
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

  <!-- Navigation -->
  <nav class="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-6">
    <div class="space-y-7">
      {#each navGroups as group}
        <section>
          {#if group.label}
            <p
              class="mb-2.5 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300/70"
            >
              {group.label}
            </p>
          {/if}

          <div class="space-y-1.5">
            {#each group.items as item}
              <a
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                onclick={() => onCloseMobile?.()}
                class={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-bold transition ${
                  isActive(item.href)
                    ? "bg-white text-[#062b63] shadow-lg shadow-black/10"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                {#if isActive(item.href)}
                  <span
                    class="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#f8c900]"
                  ></span>
                {/if}

                <span
                  class={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                    isActive(item.href)
                      ? "bg-[#f8c900]/20 text-[#062b63]"
                      : "bg-white/5 text-blue-200 group-hover:bg-white/10 group-hover:text-white"
                  }`}
                >
                  <NavIcon name={item.icon} />
                </span>

                <span class="truncate">{item.label}</span>

                {#if isActive(item.href)}
                  <svg
                    class="ml-auto h-4 w-4 shrink-0 text-[#0c438c]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                {/if}
              </a>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  </nav>

  <!-- User -->
  <div class="relative z-10 shrink-0 border-t border-white/10 bg-[#052759] p-4">
    <div class="mb-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f8c900] text-sm font-black text-[#062b63]"
      >
        {initials}
      </div>

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-bold text-white">
          {user.name}
        </p>

        <p class="mt-0.5 truncate text-xs font-medium text-blue-200/80">
          {user.email}
        </p>
      </div>
    </div>

    <button
      type="button"
      onclick={() => onLogout()}
      class="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-blue-100 transition hover:border-red-300/30 hover:bg-red-500/10 hover:text-red-200"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
      </svg>

      Keluar
    </button>
  </div>
</aside>
