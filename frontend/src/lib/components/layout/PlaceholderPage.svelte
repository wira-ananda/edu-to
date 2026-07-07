<script lang="ts">
  type Props = {
    title: string;
    description: string;
  };

  let { title, description }: Props = $props();
</script>

<section class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
  <h2 class="text-2xl font-bold text-slate-950">{title}</h2>
  <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>

  <div
    class="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500"
  >
    Halaman ini disiapkan sebagai placeholder. Fitur detailnya bisa dilanjutkan
    setelah fitur utama selesai.
  </div>
</section>
