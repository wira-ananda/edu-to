<script lang="ts">
  import { onDestroy } from "svelte";

  import {
    compressQuestionImage,
    formatFileSize,
  } from "$lib/utils/image-compression";

  type Props = {
    existingImageUrl?: string | null;

    imageAltText: string;
    imageFile: File | null;
    removeImage: boolean;
    compressing: boolean;

    disabled?: boolean;

    onDirty: () => void;
  };

  let {
    existingImageUrl = null,

    imageAltText = $bindable(),
    imageFile = $bindable<File | null>(null),
    removeImage = $bindable(false),
    compressing = $bindable(false),

    disabled = false,

    onDirty,
  }: Props = $props();

  let imagePreviewUrl = $state("");
  let imageInfo = $state("");

  let imageInput: HTMLInputElement | undefined = $state();

  const currentPreviewUrl = $derived(
    imagePreviewUrl || (!removeImage ? (existingImageUrl ?? "") : ""),
  );

  const hasImage = $derived(
    Boolean(imageFile || (existingImageUrl && !removeImage)),
  );

  function revokePreviewUrl() {
    if (!imagePreviewUrl) {
      return;
    }

    URL.revokeObjectURL(imagePreviewUrl);

    imagePreviewUrl = "";
  }

  function resetInput() {
    if (imageInput) {
      imageInput.value = "";
    }
  }

  async function handleImageChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) {
      return;
    }

    compressing = true;
    imageInfo = "";

    onDirty();

    try {
      const compressed = await compressQuestionImage(file);

      revokePreviewUrl();

      imageFile = compressed.file;

      imagePreviewUrl = compressed.previewUrl;

      removeImage = false;

      imageInfo = `Gambar dikompresi menjadi ${formatFileSize(
        compressed.file.size,
      )}.`;
    } catch (error) {
      imageFile = null;

      revokePreviewUrl();
      resetInput();

      imageInfo =
        error instanceof Error ? error.message : "Gagal memproses gambar.";
    } finally {
      compressing = false;
    }
  }

  function cancelSelectedImage() {
    imageFile = null;
    imageInfo = "";

    revokePreviewUrl();
    resetInput();

    onDirty();
  }

  function removeCurrentImage() {
    cancelSelectedImage();

    removeImage = true;

    imageInfo = "Gambar lama akan dihapus setelah perubahan disimpan.";

    onDirty();
  }

  function cancelRemoveImage() {
    removeImage = false;
    imageInfo = "";

    onDirty();
  }

  onDestroy(() => {
    revokePreviewUrl();
  });
</script>

<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
  <div>
    <label for="questionImage" class="text-sm font-bold text-slate-700">
      Gambar Soal

      <span class="font-medium text-slate-400"> · opsional </span>
    </label>

    <p class="mt-1 text-xs leading-5 text-slate-500">
      Format JPG, PNG, atau WEBP. Gambar otomatis dikompresi sebelum diupload.
    </p>
  </div>

  {#if currentPreviewUrl}
    <div
      class="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <img
        src={currentPreviewUrl}
        alt={imageAltText || "Preview gambar soal"}
        class="max-h-[320px] w-full object-contain"
      />
    </div>
  {/if}

  {#if imageInfo}
    <div
      class={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${
        removeImage
          ? "bg-amber-50 text-amber-700"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {imageInfo}
    </div>
  {/if}

  <div class="mt-4 flex flex-wrap gap-2">
    {#if imageFile}
      <button
        type="button"
        onclick={cancelSelectedImage}
        {disabled}
        class="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        Batalkan Gambar Baru
      </button>
    {:else if existingImageUrl && !removeImage}
      <button
        type="button"
        onclick={removeCurrentImage}
        {disabled}
        class="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        Hapus Gambar Lama
      </button>
    {/if}

    {#if removeImage && existingImageUrl}
      <button
        type="button"
        onclick={cancelRemoveImage}
        {disabled}
        class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
      >
        Batalkan Hapus
      </button>
    {/if}
  </div>

  <input
    bind:this={imageInput}
    id="questionImage"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onchange={handleImageChange}
    disabled={disabled || compressing}
    class="mt-4 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[#062b63] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white disabled:opacity-60"
  />

  {#if compressing}
    <p class="mt-2 text-xs font-semibold text-slate-500">
      Mengompresi gambar...
    </p>
  {/if}

  <div class="mt-4">
    <label for="imageAltText" class="text-sm font-bold text-slate-700">
      Deskripsi Gambar

      {#if hasImage}
        <span class="text-red-500"> * </span>
      {/if}
    </label>

    <input
      id="imageAltText"
      type="text"
      bind:value={imageAltText}
      oninput={onDirty}
      {disabled}
      placeholder="Jelaskan isi gambar secara singkat"
      class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
    />

    <p class="mt-2 text-xs text-slate-400">
      Digunakan untuk aksesibilitas dan analisis tingkat kesulitan.
    </p>
  </div>
</div>
