<script lang="ts">
  type BreadcrumbItem = {
    label: string;
    href?: string;
  };

  type Props = {
    title: string;
    breadcrumbs: BreadcrumbItem[];
    version?: string;
  };

  let { title, breadcrumbs, version = "v2.4.1" }: Props = $props();
</script>

<header
  class="sticky top-0 z-30 h-[76px] border-b border-slate-200 bg-white/95 backdrop-blur"
>
  <div class="flex h-full items-center justify-between px-8">
    <div>
      <h1 class="text-xl font-bold text-slate-950">{title}</h1>

      <nav class="mt-1 flex items-center gap-2 text-xs text-slate-500">
        {#each breadcrumbs as breadcrumb, index}
          {#if breadcrumb.href && index < breadcrumbs.length - 1}
            <a
              href={breadcrumb.href}
              class="font-medium text-slate-500 hover:text-blue-900"
            >
              {breadcrumb.label}
            </a>
          {:else}
            <span
              class={index === breadcrumbs.length - 1
                ? "font-semibold text-blue-900"
                : ""}
            >
              {breadcrumb.label}
            </span>
          {/if}

          {#if index < breadcrumbs.length - 1}
            <span>/</span>
          {/if}
        {/each}
      </nav>
    </div>

    <div class="flex items-center gap-3">
      <div class="relative hidden md:block">
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
        class="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        aria-label="Help"
      >
        ?
      </button>

      <span
        class="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500"
      >
        {version}
      </span>
    </div>
  </div>
</header>
