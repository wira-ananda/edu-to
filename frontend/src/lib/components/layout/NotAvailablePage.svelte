<script lang="ts">
  import { goto } from "$app/navigation";

  type Props = {
    status?: string;
    title?: string;
    description?: string;
    requestedPath?: string;
    homeHref?: string;
    homeLabel?: string;
  };

  let {
    status = "404",
    title = "Halaman tidak tersedia",
    description = "Halaman yang kamu buka belum tersedia atau alamat URL tidak sesuai.",
    requestedPath = "",
    homeHref = "/",
    homeLabel = "Kembali ke Dashboard",
  }: Props = $props();

  function handleBack() {
    if (history.length > 1) {
      history.back();
      return;
    }

    goto(homeHref);
  }
</script>

<section class="flex min-h-[calc(100vh-140px)] items-center justify-center">
  <div
    class="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"
  >
    <div
      class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-900"
    >
      <svg
        class="h-8 w-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
      >
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path
          d="M10.3 3.8 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0z"
        />
      </svg>
    </div>

    <p class="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-blue-900">
      Error {status}
    </p>

    <h1 class="mt-3 text-3xl font-bold text-slate-950">
      {title}
    </h1>

    <p class="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
      {description}
    </p>

    {#if requestedPath}
      <div
        class="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left"
      >
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Requested URL
        </p>

        <p class="mt-1 break-all text-sm font-semibold text-slate-700">
          {requestedPath}
        </p>
      </div>
    {/if}

    <div class="mt-7 flex justify-center gap-3">
      <button
        type="button"
        onclick={() => goto(homeHref)}
        class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white"
      >
        {homeLabel}
      </button>

      <button
        type="button"
        onclick={handleBack}
        class="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700"
      >
        Kembali
      </button>
    </div>
  </div>
</section>
