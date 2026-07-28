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

  let { title, breadcrumbs, onOpenSidebar }: Props = $props();
</script>

<header
  class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl"
>
  <div
    class="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:min-h-[76px] lg:px-8"
  >
    <!-- LEFT: Page information -->
    <div class="flex min-w-0 items-center gap-3">
      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#062b63] text-white shadow-sm transition hover:bg-[#0b3c7c] lg:hidden"
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
        <h1
          class="truncate text-lg font-black tracking-tight text-slate-950 sm:text-xl"
        >
          {title}
        </h1>

        {#if breadcrumbs.length > 0}
          <nav
            class="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden text-xs"
            aria-label="Breadcrumb"
          >
            {#each breadcrumbs as breadcrumb, index}
              {#if breadcrumb.href && index < breadcrumbs.length - 1}
                <a
                  href={breadcrumb.href}
                  class="shrink-0 font-medium text-slate-400 transition hover:text-[#0b3c7c]"
                >
                  {breadcrumb.label}
                </a>
              {:else}
                <span
                  class={index === breadcrumbs.length - 1
                    ? "truncate font-semibold text-[#0b3c7c]"
                    : "shrink-0 font-medium text-slate-400"}
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
        {/if}
      </div>
    </div>

    <!-- RIGHT: School wordmark -->
    <div class="hidden shrink-0 items-center sm:flex">
      <div class="relative overflow-hidden rounded-xl bg-[#062b63] shadow-sm">
        <!-- subtle yellow accent -->
        <div class="absolute right-0 top-0 h-full w-5 bg-[#f8c900]"></div>

        <div class="relative flex items-center gap-3 py-2.5 pl-4 pr-8">
          <div class="h-8 w-1 rounded-full bg-[#f8c900]"></div>

          <div>
            <p
              class="text-[9px] font-bold uppercase tracking-[0.24em] text-blue-200"
            >
              Sistem Tryout
            </p>

            <p
              class="mt-0.5 whitespace-nowrap text-sm font-black uppercase tracking-[0.08em] text-white"
            >
              SMAN 1 Gowa
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom school accent -->
  <div class="flex h-[3px] w-full">
    <div class="w-16 bg-[#f8c900]"></div>
    <div class="w-28 bg-[#0b438f]"></div>
    <div class="flex-1 bg-transparent"></div>
  </div>
</header>
