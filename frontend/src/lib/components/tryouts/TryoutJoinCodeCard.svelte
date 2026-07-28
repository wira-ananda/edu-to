<script lang="ts">
  type Props = {
    joinCode: string | null;
    enabled: boolean;

    regenerating?: boolean;
    showRegenerate?: boolean;

    onRegenerate?: () => void | Promise<void>;
  };

  let {
    joinCode,
    enabled,
    regenerating = false,
    showRegenerate = false,
    onRegenerate,
  }: Props = $props();

  let copied = $state(false);
  let copyError = $state("");

  async function copyCode() {
    if (!joinCode) return;

    copyError = "";

    try {
      await navigator.clipboard.writeText(joinCode);

      copied = true;

      window.setTimeout(() => {
        copied = false;
      }, 1500);
    } catch {
      copyError = "Gagal menyalin kode.";
    }
  }
</script>

<div
  class="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4"
>
  <div class="absolute left-0 top-0 h-full w-1 bg-[#f8c900]"></div>

  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <p
        class="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400"
      >
        Kode Bergabung
      </p>

      <p class="mt-1 text-xs text-slate-500">
        Bagikan kode ini kepada siswa untuk bergabung langsung.
      </p>
    </div>

    <span
      class={`rounded-full px-2.5 py-1 text-[10px] font-black ${
        enabled ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
      }`}
    >
      {enabled ? "Aktif" : "Nonaktif"}
    </span>
  </div>

  {#if joinCode}
    <div class="mt-4 flex flex-wrap items-center gap-2">
      <code
        class="rounded-xl bg-[#062b63] px-4 py-2.5 text-base font-black tracking-[0.22em] text-white"
      >
        {joinCode}
      </code>

      <button
        type="button"
        onclick={copyCode}
        class="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
      >
        {copied ? "Tersalin ✓" : "Salin"}
      </button>

      {#if showRegenerate}
        <button
          type="button"
          onclick={() => onRegenerate?.()}
          disabled={regenerating}
          class="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
        >
          {regenerating ? "Membuat..." : "Buat Ulang"}
        </button>
      {/if}
    </div>
  {:else}
    <div class="mt-4">
      <p class="text-sm font-semibold text-slate-400">
        Tryout belum memiliki kode.
      </p>

      {#if showRegenerate}
        <button
          type="button"
          onclick={() => onRegenerate?.()}
          disabled={regenerating}
          class="mt-3 rounded-xl bg-[#062b63] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {regenerating ? "Membuat..." : "Buat Kode"}
        </button>
      {/if}
    </div>
  {/if}

  {#if copyError}
    <p class="mt-2 text-xs font-semibold text-red-600">
      {copyError}
    </p>
  {/if}
</div>
