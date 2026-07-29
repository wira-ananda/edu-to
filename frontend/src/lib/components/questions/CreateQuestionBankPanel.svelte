<script lang="ts">
  type Props = {
    creating?: boolean;
    onCancel: () => void;
    onSubmit: (name: string) => Promise<boolean>;
  };

  let { creating = false, onCancel, onSubmit }: Props = $props();

  let name = $state("");

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    const cleanedName = name.trim();

    if (!cleanedName || creating) {
      return;
    }

    const success = await onSubmit(cleanedName);

    if (success) {
      name = "";
    }
  }

  function handleCancel() {
    name = "";
    onCancel();
  }
</script>

<form
  onsubmit={handleSubmit}
  class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
>
  <div class="absolute left-0 top-0 h-full w-1 bg-[#f8c900]"></div>

  <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
    <div class="min-w-0 flex-1">
      <label for="questionBankName" class="text-sm font-bold text-slate-700">
        Nama Bank Soal
      </label>

      <p class="mt-1 text-xs text-slate-400">
        Gunakan nama yang mudah dikenali, misalnya mata pelajaran dan kelas.
      </p>

      <input
        id="questionBankName"
        type="text"
        bind:value={name}
        disabled={creating}
        placeholder="Contoh: Matematika Kelas 12"
        class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
      />
    </div>

    <div class="flex gap-2">
      <button
        type="button"
        onclick={handleCancel}
        disabled={creating}
        class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
      >
        Batal
      </button>

      <button
        type="submit"
        disabled={creating || !name.trim()}
        class="rounded-xl bg-[#062b63] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0c438c] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {creating ? "Membuat..." : "Buat Bank"}
      </button>
    </div>
  </div>
</form>
