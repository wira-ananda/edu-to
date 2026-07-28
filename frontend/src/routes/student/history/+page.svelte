<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  import {
    getStudentSessionsCached,
    invalidateStudentSessionsCache,
    readStudentSessionsCache,
  } from "$lib/cache/student-page-cache";

  import StudentHistoryItem from "$lib/components/history/StudentHistoryItem.svelte";

  import type { StudentSessionsResponse } from "$lib/types/student";

  type HistoryFilter = "ALL" | "ONGOING" | "FINISHED";

  let loading = $state(true);
  let refreshing = $state(false);

  let errorMessage = $state("");

  let searchQuery = $state("");
  let activeFilter = $state<HistoryFilter>("ALL");

  let sessions = $state<StudentSessionsResponse["sessions"]>([]);

  const ongoingSessions = $derived(
    sessions.filter((session) => session.status === "ONGOING"),
  );

  const finishedSessions = $derived(
    sessions.filter((session) => session.status === "FINISHED"),
  );

  const averageScore = $derived.by(() => {
    if (finishedSessions.length === 0) {
      return 0;
    }

    const totalScore = finishedSessions.reduce(
      (total, session) => total + session.score,
      0,
    );

    return Math.round(totalScore / finishedSessions.length);
  });

  const filteredSessions = $derived.by(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return sessions
      .filter((session) => {
        if (activeFilter !== "ALL" && session.status !== activeFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const searchableText = [
          session.tryout.title,
          session.tryout.subject.name,
          session.tryout.owner?.name ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
      .sort((firstSession, secondSession) => {
        /*
         * Pada tab Semua, sesi yang masih berlangsung
         * lebih penting sehingga ditampilkan paling atas.
         */
        if (
          activeFilter === "ALL" &&
          firstSession.status !== secondSession.status
        ) {
          if (firstSession.status === "ONGOING") {
            return -1;
          }

          if (secondSession.status === "ONGOING") {
            return 1;
          }
        }

        return (
          new Date(secondSession.startedAt).getTime() -
          new Date(firstSession.startedAt).getTime()
        );
      });
  });

  async function loadHistory(
    options: {
      force?: boolean;
    } = {},
  ) {
    const force = options.force ?? false;

    errorMessage = "";

    const cachedSessions = !force ? readStudentSessionsCache() : null;

    if (cachedSessions) {
      sessions = cachedSessions;
      loading = false;
      return;
    }

    loading = sessions.length === 0;

    try {
      sessions = await getStudentSessionsCached({
        force,
      });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat riwayat tryout.";
    } finally {
      loading = false;
    }
  }

  async function refreshHistory() {
    refreshing = true;
    errorMessage = "";

    invalidateStudentSessionsCache();

    try {
      await loadHistory({
        force: true,
      });
    } finally {
      refreshing = false;
    }
  }

  function selectFilter(filter: HistoryFilter) {
    activeFilter = filter;
  }

  onMount(() => {
    void loadHistory();
  });
</script>

<section class="space-y-6">
  <!-- Header -->
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <p
        class="text-[10px] font-black uppercase tracking-[0.18em] text-[#0c438c]"
      >
        Tryout
      </p>

      <h2 class="mt-1 text-2xl font-black tracking-tight text-slate-950">
        Riwayat Tryout
      </h2>

      <p class="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
        Lanjutkan sesi yang belum selesai atau lihat kembali hasil tryout yang
        sudah kamu kerjakan.
      </p>
    </div>

    <button
      type="button"
      onclick={refreshHistory}
      disabled={loading || refreshing}
      class="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {#if refreshing}
        <span
          class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        ></span>

        Memuat
      {:else}
        <svg
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M20 7v5h-5" />
          <path d="M4 17v-5h5" />
          <path d="M18.5 9A7 7 0 0 0 6 7l-2 5" />
          <path d="M5.5 15A7 7 0 0 0 18 17l2-5" />
        </svg>

        Refresh
      {/if}
    </button>
  </div>

  {#if errorMessage}
    <div
      class="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5"
    >
      <div
        class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"
      >
        <svg
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>

      <div>
        <p class="text-sm font-black text-red-700">Riwayat gagal dimuat</p>

        <p class="mt-0.5 text-sm text-red-600">
          {errorMessage}
        </p>
      </div>
    </div>
  {/if}

  {#if loading}
    <!-- Loading -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {#each Array(4) as _}
        <div
          class="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white"
        ></div>
      {/each}
    </div>

    <div
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div class="space-y-3 p-5">
        {#each Array(6) as _}
          <div class="h-14 animate-pulse rounded-xl bg-slate-100"></div>
        {/each}
      </div>
    </div>
  {:else if sessions.length === 0}
    <!-- Empty state -->
    <div
      class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"
    >
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0c438c]"
      >
        <svg
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
          <path d="M12 7v5l3 2" />
        </svg>
      </div>

      <h3 class="mt-4 text-lg font-black text-slate-950">Belum ada riwayat</h3>

      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Riwayat akan muncul setelah kamu mulai mengerjakan sebuah tryout.
      </p>

      <button
        type="button"
        onclick={() => goto("/student/tryouts")}
        class="mt-5 rounded-xl bg-[#062b63] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0c438c]"
      >
        Cari Tryout
      </button>
    </div>
  {:else}
    <!-- Summary -->
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div
        class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="absolute inset-y-0 left-0 w-1 bg-[#0c438c]"></div>

        <p
          class="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400"
        >
          Total Sesi
        </p>

        <p class="mt-2 text-3xl font-black text-slate-950">
          {sessions.length}
        </p>

        <p class="mt-1 text-xs font-semibold text-slate-400">
          Seluruh percobaan
        </p>
      </div>

      <button
        type="button"
        onclick={() => selectFilter("ONGOING")}
        class="relative overflow-hidden rounded-2xl border border-amber-200 bg-white p-5 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50/30"
      >
        <div class="absolute inset-y-0 left-0 w-1 bg-[#f8c900]"></div>

        <p
          class="text-[10px] font-black uppercase tracking-[0.13em] text-amber-600"
        >
          Perlu Dilanjutkan
        </p>

        <p class="mt-2 text-3xl font-black text-slate-950">
          {ongoingSessions.length}
        </p>

        <p class="mt-1 text-xs font-semibold text-slate-400">
          Sesi masih berlangsung
        </p>
      </button>

      <button
        type="button"
        onclick={() => selectFilter("FINISHED")}
        class="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/30"
      >
        <div class="absolute inset-y-0 left-0 w-1 bg-emerald-500"></div>

        <p
          class="text-[10px] font-black uppercase tracking-[0.13em] text-emerald-600"
        >
          Selesai
        </p>

        <p class="mt-2 text-3xl font-black text-slate-950">
          {finishedSessions.length}
        </p>

        <p class="mt-1 text-xs font-semibold text-slate-400">
          Sesi telah diselesaikan
        </p>
      </button>

      <div
        class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="absolute inset-y-0 left-0 w-1 bg-[#062b63]"></div>

        <p
          class="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400"
        >
          Rata-rata Nilai
        </p>

        <p class="mt-2 text-3xl font-black text-[#0c438c]">
          {averageScore}
        </p>

        <p class="mt-1 text-xs font-semibold text-slate-400">
          Dari sesi yang selesai
        </p>
      </div>
    </div>

    <!-- Filter -->
    <div
      class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
    >
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div
          class="flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 lg:w-auto"
        >
          <button
            type="button"
            onclick={() => selectFilter("ALL")}
            class={`flex min-w-max items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black transition ${
              activeFilter === "ALL"
                ? "bg-white text-[#062b63] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Semua

            <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
              {sessions.length}
            </span>
          </button>

          <button
            type="button"
            onclick={() => selectFilter("ONGOING")}
            class={`flex min-w-max items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black transition ${
              activeFilter === "ONGOING"
                ? "bg-white text-amber-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Berlangsung

            <span
              class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700"
            >
              {ongoingSessions.length}
            </span>
          </button>

          <button
            type="button"
            onclick={() => selectFilter("FINISHED")}
            class={`flex min-w-max items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black transition ${
              activeFilter === "FINISHED"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Selesai

            <span
              class="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700"
            >
              {finishedSessions.length}
            </span>
          </button>
        </div>

        <div class="relative w-full lg:max-w-sm">
          <svg
            class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            type="search"
            bind:value={searchQuery}
            placeholder="Cari tryout atau bank soal..."
            class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#0c438c] focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </div>
      </div>
    </div>

    {#if filteredSessions.length === 0}
      <!-- Filter empty -->
      <div
        class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
      >
        <p class="font-black text-slate-800">Tidak ada sesi yang ditemukan</p>

        <p class="mt-1 text-sm text-slate-500">
          Coba ubah filter atau kata pencarian.
        </p>

        <button
          type="button"
          onclick={() => {
            activeFilter = "ALL";
            searchQuery = "";
          }}
          class="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700"
        >
          Reset Filter
        </button>
      </div>
    {:else}
      <!-- Mobile -->
      <div class="grid gap-4 md:hidden">
        {#each filteredSessions as session (session.id)}
          <StudentHistoryItem {session} variant="card" />
        {/each}
      </div>

      <!-- Desktop -->
      <div
        class="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block"
      >
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1100px] text-left text-sm">
            <thead
              class="bg-slate-50 text-[10px] font-black uppercase tracking-[0.11em] text-slate-400"
            >
              <tr>
                <th class="px-5 py-4">Tryout</th>
                <th class="px-5 py-4">Pemilik</th>
                <th class="px-5 py-4">Attempt</th>
                <th class="px-5 py-4">Status</th>
                <th class="px-5 py-4">Progress</th>
                <th class="px-5 py-4">Level Awal</th>
                <th class="px-5 py-4">Level Akhir</th>
                <th class="px-5 py-4">Nilai</th>
                <th class="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {#each filteredSessions as session (session.id)}
                <StudentHistoryItem {session} variant="table" />
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <p class="text-center text-xs font-semibold text-slate-400">
      Menampilkan {filteredSessions.length} dari {sessions.length} sesi.
    </p>
  {/if}
</section>
