<script lang="ts">
  type BreadcrumbItem = {
    label: string;
    href?: string;
  };

  type Props = {
    title: string;
    breadcrumbs: BreadcrumbItem[];
    version?: string;
    onOpenSidebar?: () => void;
  };

  let {
    title,
    breadcrumbs,
    version = "v2.4.1",
    onOpenSidebar,
  }: Props = $props();
</script>

<header
  class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"
>
  <div
    class="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:min-h-[76px] lg:px-8"
  >
    <div class="flex min-w-0 items-center gap-3">
      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 lg:hidden"
        aria-label="Buka menu"
        onclick={() => onOpenSidebar?.()}
      >
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      </button>

      <div class="min-w-0">
        <h1 class="truncate text-lg font-bold text-slate-950 sm:text-xl">
          {title}
        </h1>

        <nav
          class="mt-1 flex min-w-0 items-center gap-2 overflow-hidden text-xs text-slate-500"
          aria-label="Breadcrumb"
        >
          {#each breadcrumbs as breadcrumb, index}
            {#if breadcrumb.href && index < breadcrumbs.length - 1}
              <a
                href={breadcrumb.href}
                class="shrink-0 font-medium text-slate-500 hover:text-blue-900"
              >
                {breadcrumb.label}
              </a>
            {:else}
              <span
                class={index === breadcrumbs.length - 1
                  ? "truncate font-semibold text-blue-900"
                  : "shrink-0"}
              >
                {breadcrumb.label}
              </span>
            {/if}

            {#if index < breadcrumbs.length - 1}
              <span class="shrink-0">/</span>
            {/if}
          {/each}
        </nav>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2 sm:gap-3">
      <div class="relative hidden xl:block">
        <svg
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>

        <input
          type="text"
          placeholder="Search anything..."
          class="h-11 w-72 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-blue-800 focus:bg-white"
        />
      </div>

      <button
        type="button"
        class="hidden h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 sm:flex"
        aria-label="Help"
      >
        ?
      </button>

      <span
        class="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 sm:inline-flex"
      >
        {version}
      </span>
    </div>
  </div>
</header>
