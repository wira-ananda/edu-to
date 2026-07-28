<script lang="ts">
  import type { TeacherTryoutResultsResponse } from "$lib/types/teacher";

  type Session = TeacherTryoutResultsResponse["sessions"][number];

  type Props = {
    sessions: Session[];
  };

  let { sessions }: Props = $props();

  let search = $state("");
  let statusFilter = $state<"ALL" | "ONGOING" | "FINISHED">("ALL");
  let attemptFilter = $state("ALL");

  const attemptOptions = $derived.by(() => {
    return Array.from(
      new Set(sessions.map((session) => session.attemptNumber)),
    ).sort((a, b) => a - b);
  });

  const filteredSessions = $derived.by(() => {
    const keyword = search.trim().toLowerCase();

    return sessions.filter((session) => {
      const matchesSearch =
        !keyword ||
        session.student.name.toLowerCase().includes(keyword) ||
        session.student.email.toLowerCase().includes(keyword) ||
        (session.student.school ?? "").toLowerCase().includes(keyword) ||
        (session.student.className ?? "").toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" || session.status === statusFilter;

      const matchesAttempt =
        attemptFilter === "ALL" ||
        session.attemptNumber === Number(attemptFilter);

      return matchesSearch && matchesStatus && matchesAttempt;
    });
  });

  const ongoingCount = $derived(
    sessions.filter((session) => session.status === "ONGOING").length,
  );

  function formatDateTime(value: string | null) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function getProgress(session: Session) {
    if (session.totalQuestions <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((session.answeredCount / session.totalQuestions) * 100),
    );
  }

  function clearFilters() {
    search = "";
    statusFilter = "ALL";
    attemptFilter = "ALL";
  }
</script>

<section
  class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
>
  <div class="border-b border-slate-100 p-5">
    <div
      class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
    >
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-lg font-black text-slate-950">Detail Sesi Siswa</h3>

          <span
            class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600"
          >
            {sessions.length} sesi
          </span>

          {#if ongoingCount > 0}
            <span
              class="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700"
            >
              {ongoingCount} berlangsung
            </span>
          {/if}
        </div>

        <p class="mt-1 text-sm text-slate-500">
          Cari siswa atau filter sesi untuk melihat hasil yang dibutuhkan.
        </p>
      </div>

      <div class="grid gap-2 sm:grid-cols-3">
        <div class="relative sm:min-w-64">
          <svg
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            type="search"
            bind:value={search}
            placeholder="Cari siswa..."
            aria-label="Cari siswa"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#123c8c] focus:bg-white"
          />
        </div>

        <select
          bind:value={statusFilter}
          aria-label="Filter status sesi"
          class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
        >
          <option value="ALL">Semua status</option>
          <option value="FINISHED">Selesai</option>
          <option value="ONGOING">Berlangsung</option>
        </select>

        <select
          bind:value={attemptFilter}
          aria-label="Filter percobaan"
          class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
        >
          <option value="ALL">Semua percobaan</option>

          {#each attemptOptions as attempt}
            <option value={String(attempt)}>
              Percobaan #{attempt}
            </option>
          {/each}
        </select>
      </div>
    </div>

    {#if search || statusFilter !== "ALL" || attemptFilter !== "ALL"}
      <div class="mt-3 flex items-center justify-between gap-3">
        <p class="text-xs font-semibold text-slate-500">
          Menampilkan {filteredSessions.length} dari {sessions.length} sesi.
        </p>

        <button
          type="button"
          onclick={clearFilters}
          class="text-xs font-bold text-[#123c8c]"
        >
          Reset filter
        </button>
      </div>
    {/if}
  </div>

  {#if sessions.length === 0}
    <div class="p-10 text-center">
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
      >
        <svg
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6" />
          <path d="M22 11h-6" />
        </svg>
      </div>

      <p class="mt-3 text-sm font-bold text-slate-700">
        Belum ada sesi pengerjaan
      </p>

      <p class="mt-1 text-sm text-slate-500">
        Hasil siswa akan muncul setelah peserta mulai mengerjakan.
      </p>
    </div>
  {:else if filteredSessions.length === 0}
    <div class="p-10 text-center">
      <p class="text-sm font-bold text-slate-700">Tidak ada sesi yang sesuai</p>

      <p class="mt-1 text-sm text-slate-500">
        Coba ubah kata pencarian atau filter.
      </p>

      <button
        type="button"
        onclick={clearFilters}
        class="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-[#123c8c]"
      >
        Reset Filter
      </button>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full min-w-[1040px] text-left text-sm">
        <thead
          class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"
        >
          <tr>
            <th scope="col" class="px-5 py-4">Siswa</th>
            <th scope="col" class="px-5 py-4">Percobaan</th>
            <th scope="col" class="px-5 py-4">Status</th>
            <th scope="col" class="px-5 py-4">Nilai</th>
            <th scope="col" class="px-5 py-4">Jawaban</th>
            <th scope="col" class="px-5 py-4">Progress</th>
            <th scope="col" class="px-5 py-4">Waktu</th>
          </tr>
        </thead>

        <tbody>
          {#each filteredSessions as session}
            {@const progress = getProgress(session)}

            <tr
              class="border-t border-slate-100 transition hover:bg-slate-50/60"
            >
              <td class="px-5 py-4">
                <p class="font-bold text-slate-900">
                  {session.student.name}
                </p>

                <p class="mt-0.5 text-xs text-slate-400">
                  {session.student.email}
                </p>

                <p class="mt-0.5 text-xs font-medium text-slate-400">
                  {session.student.school ?? "-"}
                  {#if session.student.className}
                    · {session.student.className}
                  {/if}
                </p>
              </td>

              <td class="px-5 py-4">
                <span
                  class="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-100 px-2 font-black text-slate-800"
                >
                  #{session.attemptNumber}
                </span>
              </td>

              <td class="px-5 py-4">
                {#if session.status === "FINISHED"}
                  <span
                    class="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
                  >
                    Selesai
                  </span>
                {:else}
                  <span
                    class="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700"
                  >
                    Berlangsung
                  </span>
                {/if}
              </td>

              <td class="px-5 py-4">
                {#if session.status === "FINISHED"}
                  <span class="text-lg font-black text-[#123c8c]">
                    {session.score}
                  </span>
                {:else}
                  <span
                    class="text-sm font-bold text-slate-400"
                    title="Nilai final belum tersedia"
                  >
                    —
                  </span>
                {/if}
              </td>

              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div>
                    <p class="text-xs font-semibold text-slate-400">Benar</p>

                    <p class="font-black text-emerald-700">
                      {session.correctCount}
                    </p>
                  </div>

                  <div class="h-8 w-px bg-slate-100"></div>

                  <div>
                    <p class="text-xs font-semibold text-slate-400">Salah</p>

                    <p class="font-black text-red-600">
                      {session.wrongCount}
                    </p>
                  </div>
                </div>
              </td>

              <td class="px-5 py-4">
                <div class="min-w-32">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-xs font-bold text-slate-700">
                      {session.answeredCount}/{session.totalQuestions}
                    </p>

                    <p class="text-[11px] font-bold text-slate-400">
                      {progress}%
                    </p>
                  </div>

                  <div
                    class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div
                      class={`h-full rounded-full ${
                        session.status === "FINISHED"
                          ? "bg-emerald-500"
                          : "bg-amber-400"
                      }`}
                      style={`width: ${progress}%`}
                    ></div>
                  </div>
                </div>
              </td>

              <td class="px-5 py-4">
                <div class="space-y-1 text-xs">
                  <p class="text-slate-500">
                    <span class="font-semibold text-slate-400">Mulai</span>
                    <br />
                    {formatDateTime(session.startedAt)}
                  </p>

                  {#if session.finishedAt}
                    <p class="text-slate-500">
                      <span class="font-semibold text-slate-400">
                        Selesai
                      </span>
                      <br />
                      {formatDateTime(session.finishedAt)}
                    </p>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
