<script lang="ts">
  type BreadcrumbItem = {
    label: string;
    href?: string;
  };

  type Props = {
    title: string;
    breadcrumbs: BreadcrumbItem[];
    focusMode?: boolean;
    onOpenSidebar?: () => void;
  };

  let {
    title,
    breadcrumbs,
    focusMode = false,
    onOpenSidebar,
  }: Props = $props();
</script>

<header
  class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"
>
  <div
    class={`mx-auto flex min-h-[72px] w-full items-center justify-between gap-4 px-4 sm:px-6 lg:min-h-[76px] lg:px-8 xl:px-10 2xl:px-12 ${
      focusMode ? "max-w-[1440px]" : "max-w-[1520px]"
    }`}
  >
    <div class="flex min-w-0 items-center gap-3">
      {#if !focusMode}
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden"
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
      {/if}

      <div class="min-w-0">
        <h1
          class="truncate text-lg font-black tracking-tight text-slate-950 sm:text-xl"
        >
          {title}
        </h1>

        <nav
          class="mt-1 flex min-w-0 items-center gap-2 overflow-hidden text-xs"
          aria-label="Breadcrumb"
        >
          {#each breadcrumbs as breadcrumb, index}
            {#if breadcrumb.href && !focusMode}
              <a
                href={breadcrumb.href}
                class="shrink-0 font-semibold text-slate-400 transition hover:text-[#0c438c]"
              >
                {breadcrumb.label}
              </a>
            {:else}
              <span
                class={`${
                  index === breadcrumbs.length - 1
                    ? "truncate font-bold text-[#0c438c]"
                    : "shrink-0 font-semibold text-slate-400"
                } ${focusMode ? "cursor-default" : ""}`}
              >
                {breadcrumb.label}
              </span>
            {/if}

            {#if index < breadcrumbs.length - 1}
              <svg
                class="h-3 w-3 shrink-0 text-slate-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            {/if}
          {/each}
        </nav>
      </div>
    </div>

    <div
      class="relative hidden overflow-hidden rounded-xl bg-[#062b63] px-5 py-2.5 pr-7 text-white shadow-sm sm:block"
    >
      <div class="absolute right-0 top-0 h-full w-3 bg-[#f8c900]"></div>

      <div
        class="absolute left-3 top-2 h-7 w-1 rounded-full bg-[#f8c900]"
      ></div>

      <div class="pl-3">
        <p
          class="text-[8px] font-black uppercase tracking-[0.3em] text-blue-100"
        >
          Sistem Tryout
        </p>

        <p class="mt-0.5 text-xs font-black tracking-[0.12em]">SMAN 1 GOWA</p>
      </div>
    </div>
  </div>
</header>
