<script lang="ts">
  import QuestionImageField from "./QuestionImageField.svelte";

  import type { QuestionFormSubject } from "$lib/types/question-form";

  type Props = {
    subjects: QuestionFormSubject[];

    subjectId: string;
    questionText: string;

    imageAltText: string;
    imageFile: File | null;

    removeImage: boolean;
    compressing: boolean;

    existingImageUrl?: string | null;

    disabled?: boolean;

    onDirty: () => void;
  };

  let {
    subjects,

    subjectId = $bindable(),
    questionText = $bindable(),

    imageAltText = $bindable(),
    imageFile = $bindable<File | null>(null),

    removeImage = $bindable(false),
    compressing = $bindable(false),

    existingImageUrl = null,

    disabled = false,

    onDirty,
  }: Props = $props();
</script>

<section
  class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
>
  <div class="mb-5">
    <p class="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
      01 · Konten
    </p>

    <h3 class="mt-1 text-lg font-black text-slate-950">Tulis pertanyaan</h3>

    <p class="mt-1 text-sm text-slate-500">
      Tentukan bank soal dan tuliskan pertanyaan dengan jelas.
    </p>
  </div>

  <div>
    <label for="subjectId" class="text-sm font-bold text-slate-700">
      Bank Soal
    </label>

    <select
      id="subjectId"
      bind:value={subjectId}
      {disabled}
      class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
    >
      {#each subjects as subject}
        <option value={subject.id}>
          {subject.name}
        </option>
      {/each}
    </select>
  </div>

  <div class="mt-5">
    <label for="questionText" class="text-sm font-bold text-slate-700">
      Teks Soal
    </label>

    <textarea
      id="questionText"
      bind:value={questionText}
      oninput={onDirty}
      rows="6"
      {disabled}
      placeholder="Tuliskan pertanyaan di sini..."
      class="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
    ></textarea>
  </div>

  <div class="mt-5">
    <QuestionImageField
      {existingImageUrl}
      bind:imageAltText
      bind:imageFile
      bind:removeImage
      bind:compressing
      {disabled}
      {onDirty}
    />
  </div>
</section>
