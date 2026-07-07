<script lang="ts">
  import { goto } from "$app/navigation";
</script>

<main class="p-8">
  <section class="mx-auto max-w-6xl">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 class="text-2xl font-bold text-slate-900">Dashboard Admin</h1>

      <p class="mt-2 text-slate-600">
        Kelola bank soal, klasifikasi tingkat kesulitan otomatis, dan prioritas
        kemunculan soal untuk proses WRS.
      </p>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-sm text-slate-500">Difficulty</p>
          <p class="mt-1 font-semibold text-slate-900">
            Ditentukan otomatis dari teks soal.
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-sm text-slate-500">Prioritas</p>
          <p class="mt-1 font-semibold text-slate-900">
            Dipilih admin tanpa input angka manual.
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-sm text-slate-500">Bobot WRS</p>
          <p class="mt-1 font-semibold text-slate-900">
            Dihitung sistem dari prioritas.
          </p>
        </div>
      </div>

      <div class="mt-6 flex gap-3">
        <button
          type="button"
          onclick={() => goto("/admin/questions")}
          class="rounded-lg bg-blue-900 px-4 py-2 font-semibold text-white"
        >
          Lihat Bank Soal
        </button>

        <button
          type="button"
          onclick={() => goto("/admin/questions/new")}
          class="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
        >
          Tambah Soal
        </button>
      </div>
    </div>
  </section>
</main>
