<script lang="ts">
  import { goto } from "$app/navigation";
</script>

<section class="space-y-6">
  <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 class="text-2xl font-bold text-slate-950">Dashboard Admin</h2>

    <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
      Kelola bank soal, klasifikasi tingkat kesulitan otomatis, prioritas
      kemunculan soal, dan bobot untuk proses Weighted Random Selection.
    </p>

    <div class="mt-6 grid gap-4 md:grid-cols-3">
      <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p class="text-sm font-semibold text-slate-500">Difficulty</p>
        <p class="mt-2 text-lg font-bold text-slate-950">Otomatis</p>
        <p class="mt-1 text-sm text-slate-600">
          Sistem membaca teks soal dan indikator kesulitan.
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p class="text-sm font-semibold text-slate-500">Prioritas</p>
        <p class="mt-2 text-lg font-bold text-slate-950">Dipilih Admin</p>
        <p class="mt-1 text-sm text-slate-600">
          Admin memilih rendah, normal, tinggi, atau sangat tinggi.
        </p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p class="text-sm font-semibold text-slate-500">Bobot WRS</p>
        <p class="mt-2 text-lg font-bold text-slate-950">Dihitung Sistem</p>
        <p class="mt-1 text-sm text-slate-600">
          Bobot dipakai untuk peluang kemunculan soal.
        </p>
      </div>
    </div>

    <div class="mt-6 flex gap-3">
      <button
        type="button"
        onclick={() => goto("/admin/questions")}
        class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white"
      >
        Lihat Bank Soal
      </button>

      <button
        type="button"
        onclick={() => goto("/admin/questions/new")}
        class="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700"
      >
        Tambah Soal
      </button>
    </div>
  </div>
</section>
