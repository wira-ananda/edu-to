<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type {
    StartTryoutResponse,
    StudentTryoutItem,
    StudentTryoutsResponse,
  } from "$lib/types/student";

  let loading = $state(true);
  let startingTryoutId = $state("");
  let errorMessage = $state("");
  let tryouts = $state<StudentTryoutItem[]>([]);

  async function loadTryouts() {
    loading = true;
    errorMessage = "";

    try {
      const result = await apiFetch<StudentTryoutsResponse>("/student/tryouts");
      tryouts = result.tryouts;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat daftar tryout.";
    } finally {
      loading = false;
    }
  }

  async function startTryout(tryoutId: string) {
    startingTryoutId = tryoutId;
    errorMessage = "";

    try {
      const result = await apiFetch<StartTryoutResponse>(
        "/student/tryouts/start",
        {
          method: "POST",
          body: JSON.stringify({
            tryoutId,
          }),
        },
      );

      await goto(`/student/tryouts/${result.session.id}`);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memulai tryout.";
    } finally {
      startingTryoutId = "";
    }
  }

  onMount(loadTryouts);
</script>

<section class="space-y-5">
  <div>
    <h2 class="text-2xl font-bold text-slate-950">Mulai Tryout</h2>
    <p class="mt-1 text-sm text-slate-500">
      Pilih paket tryout yang sudah disiapkan admin.
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
    <div
      class="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm"
    >
      Memuat tryout...
    </div>
  {:else if tryouts.length === 0}
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p class="text-sm font-semibold text-slate-600">
        Belum ada tryout yang tersedia.
      </p>

      <p class="mt-2 text-sm text-slate-500">
        Hubungi admin untuk membuat paket tryout terlebih dahulu.
      </p>
    </div>
  {:else}
    <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {#each tryouts as tryout}
        <article
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p
            class="text-sm font-semibold uppercase tracking-wide text-slate-400"
          >
            Tryout
          </p>

          <h3 class="mt-1 text-xl font-bold text-slate-950">
            {tryout.title}
          </h3>

          <p class="mt-1 text-sm text-slate-500">
            Bank soal: {tryout.bank.name}
          </p>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-slate-50 p-4">
              <p
                class="text-xs font-bold uppercase tracking-wide text-slate-400"
              >
                Jumlah Soal
              </p>

              <p class="mt-1 text-2xl font-bold text-slate-950">
                {tryout.totalQuestions}
              </p>
            </div>

            <div class="rounded-xl bg-slate-50 p-4">
              <p
                class="text-xs font-bold uppercase tracking-wide text-slate-400"
              >
                Durasi
              </p>

              <p class="mt-1 text-2xl font-bold text-slate-950">
                {tryout.durationMinutes}
                <span class="text-sm font-semibold text-slate-500">menit</span>
              </p>
            </div>
          </div>

          <p class="mt-4 text-xs text-slate-500">
            Sistem menentukan level awal secara acak. Soal berikutnya dipilih
            menggunakan Weighted Random Selection.
          </p>

          {#if tryout.bank.totalAvailableQuestions < tryout.totalQuestions}
            <p
              class="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
            >
              Soal tersedia tidak cukup untuk tryout ini.
            </p>
          {/if}

          <button
            type="button"
            disabled={tryout.bank.totalAvailableQuestions <
              tryout.totalQuestions || startingTryoutId === tryout.id}
            onclick={() => startTryout(tryout.id)}
            class="mt-5 w-full rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {startingTryoutId === tryout.id ? "Memulai..." : "Mulai Tryout"}
          </button>
        </article>
      {/each}
    </div>
  {/if}
</section>
