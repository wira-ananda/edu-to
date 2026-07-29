<script lang="ts">
  type Props = {
    joinCode: string | null;
    enabled?: boolean;
    showRegenerate?: boolean;
    regenerating?: boolean;
    onRegenerate?: () => void | Promise<void>;
  };

  let {
    joinCode,
    enabled = true,
    showRegenerate = false,
    regenerating = false,
    onRegenerate,
  }: Props = $props();

  let copied = $state(false);

  async function copyCode() {
    if (!joinCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(joinCode);

      copied = true;

      window.setTimeout(() => {
        copied = false;
      }, 1500);
    } catch {
      copied = false;
    }
  }
</script>

<div
  class="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
>
  <!-- Accent -->
  <div class="absolute inset-y-0 left-0 w-1 bg-[#f8c900]"></div>

  <div class="pl-2">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p
          class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400"
        >
          Kode Bergabung
        </p>

        <p class="mt-1 text-xs leading-5 text-slate-500">
          Bagikan kode ini kepada siswa untuk bergabung langsung.
        </p>
      </div>

      <span
        class={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
          enabled
            ? "bg-emerald-100 text-emerald-700"
            : "bg-red-100 text-red-600"
        }`}
      >
        {enabled ? "Aktif" : "Nonaktif"}
      </span>
    </div>

    <!-- Code + Actions -->
    <div class="mt-4 flex flex-wrap items-center gap-2">
      {#if joinCode}
        <code
          class="flex h-10 min-w-[138px] items-center justify-center rounded-xl bg-[#062b63] px-4 text-base font-black tracking-[0.24em] text-white"
        >
          {joinCode}
        </code>
      {:else}
        <div
          class="flex h-10 min-w-[138px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 text-xs font-semibold text-slate-400"
        >
          Belum ada kode
        </div>
      {/if}

      <!-- Copy -->
      <button
        type="button"
        aria-label={copied ? "Kode tersalin" : "Salin kode"}
        title={copied ? "Tersalin" : "Salin kode"}
        disabled={!joinCode}
        onclick={copyCode}
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#0c438c]/30 hover:bg-blue-50 hover:text-[#0c438c] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {#if copied}
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>
        {:else}
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <rect x="8" y="8" width="11" height="11" rx="2" />

            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
          </svg>
        {/if}
      </button>

      <!-- Regenerate -->
      {#if showRegenerate}
        <button
          type="button"
          aria-label="Buat ulang kode"
          title="Buat ulang kode"
          disabled={regenerating}
          onclick={() => onRegenerate?.()}
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            class={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
            <path d="M4 4v5h5" />

            <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
            <path d="M20 20v-5h-5" />
          </svg>
        </button>
      {/if}
    </div>

    {#if copied}
      <p class="mt-2 text-[11px] font-semibold text-emerald-600">
        Kode berhasil disalin.
      </p>
    {/if}
  </div>
</div>
