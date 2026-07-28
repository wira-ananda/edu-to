<script lang="ts">
  import type {
    DashboardAction,
    DashboardCard,
    DashboardCardTone,
  } from "$lib/types/dashboard";

  type Props = {
    title: string;
    description: string;

    cards?: DashboardCard[];
    actions?: DashboardAction[];

    loading?: boolean;
    loadingMessage?: string;
    errorMessage?: string;
  };

  let {
    title,
    description,
    cards = [],
    actions = [],
    loading = false,
    loadingMessage = "Memuat dashboard...",
    errorMessage = "",
  }: Props = $props();

  function getCardValueClass(tone: DashboardCardTone = "default") {
    if (tone === "blue") {
      return "text-[#0c438c]";
    }

    if (tone === "green") {
      return "text-emerald-700";
    }

    if (tone === "yellow") {
      return "text-amber-600";
    }

    if (tone === "red") {
      return "text-red-600";
    }

    return "text-slate-950";
  }

  function getCardAccentClass(tone: DashboardCardTone = "default") {
    if (tone === "blue") {
      return "bg-[#0c438c]";
    }

    if (tone === "green") {
      return "bg-emerald-500";
    }

    if (tone === "yellow") {
      return "bg-[#f8c900]";
    }

    if (tone === "red") {
      return "bg-red-500";
    }

    return "bg-slate-300";
  }
</script>

<section class="space-y-6">
  <!-- Hero -->
  <div
    class="relative overflow-hidden rounded-[24px] bg-[#062b63] px-6 py-7 shadow-sm sm:px-8 sm:py-8"
  >
    <div
      class="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rotate-12 rounded-[48px] bg-[#0c438c]"
    ></div>

    <div
      class="pointer-events-none absolute right-0 top-0 h-full w-28 bg-[#f8c900]"
      style="clip-path: polygon(100% 0, 100% 100%, 20% 100%, 70% 0);"
    ></div>

    <div class="relative z-10 max-w-3xl">
      <div class="mb-4 flex items-center gap-2">
        <span class="h-1.5 w-10 rounded-full bg-[#f8c900]"></span>

        <span
          class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200"
        >
          EduTryout
        </span>
      </div>

      <h2 class="text-2xl font-black tracking-tight text-white sm:text-3xl">
        {title}
      </h2>

      <p class="mt-3 max-w-2xl text-sm leading-6 text-blue-100/80">
        {description}
      </p>
    </div>
  </div>

  {#if errorMessage}
    <div
      class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </div>
  {/if}

  {#if loading}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div class="flex items-center gap-3">
        <div
          class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0c438c]"
        ></div>

        <p class="text-sm font-semibold text-slate-500">
          {loadingMessage}
        </p>
      </div>
    </div>
  {:else}
    {#if cards.length > 0}
      <div
        class={`grid gap-4 ${
          cards.length >= 4
            ? "sm:grid-cols-2 xl:grid-cols-4"
            : cards.length === 3
              ? "md:grid-cols-3"
              : cards.length === 2
                ? "md:grid-cols-2"
                : ""
        }`}
      >
        {#each cards as card}
          <article
            class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              class={`absolute left-0 top-0 h-full w-1 ${getCardAccentClass(
                card.tone,
              )}`}
            ></div>

            <p
              class="text-xs font-bold uppercase tracking-[0.12em] text-slate-400"
            >
              {card.label}
            </p>

            <p
              class={`mt-2 text-2xl font-black tracking-tight ${getCardValueClass(
                card.tone,
              )}`}
            >
              {card.value}
            </p>

            {#if card.description}
              <p class="mt-2 text-sm leading-6 text-slate-500">
                {card.description}
              </p>
            {/if}
          </article>
        {/each}
      </div>
    {/if}

    {#if actions.length > 0}
      <div>
        <div class="mb-3">
          <h3 class="text-base font-black text-slate-950">Akses Cepat</h3>

          <p class="mt-1 text-sm text-slate-500">
            Pilih menu untuk melanjutkan aktivitas.
          </p>
        </div>

        <div
          class={`grid gap-4 ${
            actions.length >= 3
              ? "md:grid-cols-3"
              : actions.length === 2
                ? "md:grid-cols-2"
                : "max-w-xl"
          }`}
        >
          {#each actions as action}
            <a
              href={action.href}
              class={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                action.primary
                  ? "border-[#062b63] bg-[#062b63] text-white"
                  : "border-slate-200 bg-white"
              }`}
            >
              {#if action.primary}
                <div
                  class="absolute right-0 top-0 h-20 w-20 bg-[#f8c900]"
                  style="clip-path: polygon(100% 0, 100% 100%, 0 0);"
                ></div>
              {/if}

              <div class="relative z-10">
                <p
                  class={`text-lg font-black ${
                    action.primary ? "text-white" : "text-slate-950"
                  }`}
                >
                  {action.title}
                </p>

                <p
                  class={`mt-2 text-sm leading-6 ${
                    action.primary ? "text-blue-100/80" : "text-slate-500"
                  }`}
                >
                  {action.description}
                </p>

                <div
                  class={`mt-5 inline-flex items-center gap-2 text-sm font-bold ${
                    action.primary ? "text-[#f8c900]" : "text-[#0c438c]"
                  }`}
                >
                  {action.label ?? "Buka"}

                  <svg
                    class="h-4 w-4 transition-transform group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</section>
