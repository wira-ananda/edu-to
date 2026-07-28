<script lang="ts">
  type Props = {
    value?: string;
    loading?: boolean;
    disabled?: boolean;
    onSubmit: (code: string) => void | Promise<void>;
  };

  let {
    value = $bindable(""),
    loading = false,
    disabled = false,
    onSubmit,
  }: Props = $props();

  const codeReady = $derived(value.length === 6);

  function handleInput(event: Event) {
    const input = event.currentTarget as HTMLInputElement;

    value = input.value
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (!codeReady || loading || disabled) {
      return;
    }

    await onSubmit(value);
  }
</script>

<form
  onsubmit={handleSubmit}
  class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#062b63] via-[#0c438c] to-[#173fa5] p-5 text-white shadow-sm sm:p-6"
>
  <!-- decorative -->
  <div
    class="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full border-[32px] border-white/5"
  ></div>

  <div
    class="pointer-events-none absolute bottom-0 left-0 h-1.5 w-full bg-[#f8c900]"
  ></div>

  <div
    class="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
  >
    <div class="max-w-xl">
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f8c900] text-[#062b63]"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M8 9h8" />
            <path d="M8 13h5" />
            <rect x="3" y="4" width="18" height="16" rx="3" />
          </svg>
        </div>

        <div>
          <p
            class="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200"
          >
            Punya kode?
          </p>

          <h3 class="mt-0.5 text-lg font-black sm:text-xl">
            Gabung tryout dengan kode
          </h3>
        </div>
      </div>

      <p class="mt-3 text-sm leading-6 text-blue-100">
        Masukkan kode 6 karakter yang diberikan admin atau guru. Jika valid,
        kamu langsung menjadi peserta tanpa menunggu persetujuan.
      </p>
    </div>

    <div class="w-full lg:max-w-md">
      <label
        for="studentJoinCode"
        class="mb-2 block text-xs font-bold text-blue-100"
      >
        Kode tryout
      </label>

      <div class="flex flex-col gap-2 sm:flex-row">
        <div class="relative min-w-0 flex-1">
          <input
            id="studentJoinCode"
            type="text"
            {value}
            oninput={handleInput}
            maxlength="6"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            disabled={loading || disabled}
            placeholder="H7K2PA"
            class="h-12 w-full rounded-xl border border-white/20 bg-white px-4 pr-16 font-mono text-lg font-black uppercase tracking-[0.2em] text-slate-950 outline-none transition placeholder:text-slate-300 focus:ring-4 focus:ring-white/15 disabled:opacity-60"
          />

          <span
            class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400"
          >
            {value.length}/6
          </span>
        </div>

        <button
          type="submit"
          disabled={!codeReady || loading || disabled}
          class="h-12 shrink-0 rounded-xl bg-[#f8c900] px-6 text-sm font-black text-[#062b63] transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-white/70"
        >
          {#if loading}
            <span class="flex items-center justify-center gap-2">
              <span
                class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              ></span>

              Memproses
            </span>
          {:else}
            Gabung
          {/if}
        </button>
      </div>

      <p class="mt-2 text-xs text-blue-200">
        Kode tidak menggunakan spasi dan tidak membedakan huruf kecil/besar.
      </p>
    </div>
  </div>
</form>
