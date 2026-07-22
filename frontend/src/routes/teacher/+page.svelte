<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type {
    TeacherQuestionBanksResponse,
    TeacherQuestionsResponse,
    TeacherTryoutsResponse,
  } from "$lib/types/teacher";

  let loading = $state(true);
  let errorMessage = $state("");

  let totalBanks = $state(0);
  let totalQuestions = $state(0);
  let totalTryouts = $state(0);
  let openTryouts = $state(0);

  async function loadDashboard() {
    loading = true;
    errorMessage = "";

    try {
      const [banksResult, questionsResult, tryoutsResult] = await Promise.all([
        apiFetch<TeacherQuestionBanksResponse>("/teacher/question-banks"),
        apiFetch<TeacherQuestionsResponse>("/teacher/questions"),
        apiFetch<TeacherTryoutsResponse>("/teacher/tryouts"),
      ]);

      totalBanks = banksResult.banks.length;
      totalQuestions = questionsResult.questions.length;
      totalTryouts = tryoutsResult.tryouts.length;
      openTryouts = tryoutsResult.tryouts.filter(
        (tryout) => tryout.status === "OPEN",
      ).length;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat dashboard.";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void loadDashboard();
  });
</script>

<section class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold text-slate-950">Dashboard Guru</h2>

    <p class="mt-1 text-sm text-slate-500">
      Kelola bank soal, soal, tryout, dan hasil siswa dari data milikmu.
    </p>
  </div>

  {#if errorMessage}
    <p
      class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </p>
  {/if}

  {#if loading}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-500">Memuat dashboard...</p>
    </div>
  {:else}
    <div class="grid gap-4 md:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Bank Soal</p>
        <p class="mt-2 text-3xl font-black text-slate-950">{totalBanks}</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Total Soal</p>
        <p class="mt-2 text-3xl font-black text-blue-900">{totalQuestions}</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Total Tryout</p>
        <p class="mt-2 text-3xl font-black text-slate-950">{totalTryouts}</p>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-semibold text-slate-500">Tryout Dibuka</p>
        <p class="mt-2 text-3xl font-black text-emerald-700">{openTryouts}</p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <button
        type="button"
        onclick={() => goto("/teacher/questions")}
        class="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
      >
        <p class="text-lg font-bold text-slate-950">Kelola Bank Soal</p>
        <p class="mt-2 text-sm text-slate-500">
          Buat bank soal dan tambah soal milikmu.
        </p>
      </button>

      <button
        type="button"
        onclick={() => goto("/teacher/tryouts/new")}
        class="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
      >
        <p class="text-lg font-bold text-slate-950">Buat Tryout</p>
        <p class="mt-2 text-sm text-slate-500">
          Atur jumlah soal, durasi, percobaan, dan status tryout.
        </p>
      </button>

      <button
        type="button"
        onclick={() => goto("/teacher/results")}
        class="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
      >
        <p class="text-lg font-bold text-slate-950">Lihat Hasil Siswa</p>
        <p class="mt-2 text-sm text-slate-500">
          Pantau nilai dan progress siswa pada tryout milikmu.
        </p>
      </button>
    </div>
  {/if}
</section>
