<script lang="ts">
  import { goto } from "$app/navigation";
  import { getDifficultyLabel } from "$lib/types/questions";
  import type { StudentSessionsResponse } from "$lib/types/student";

  type StudentSession = StudentSessionsResponse["sessions"][number];

  type Props = {
    session: StudentSession;
    variant?: "table" | "card";
  };

  let { session, variant = "card" }: Props = $props();

  const answeredCount = $derived(session._count?.answers ?? 0);

  const progressPercentage = $derived(
    session.totalQuestions > 0
      ? Math.min(
          100,
          Math.round((answeredCount / session.totalQuestions) * 100),
        )
      : 0,
  );

  const isFinished = $derived(session.status === "FINISHED");

  function getOwnerLabel() {
    if (!session.tryout.owner) {
      return "Admin / Guru";
    }

    if (session.tryout.owner.role === "ADMIN") {
      return `Admin: ${session.tryout.owner.name}`;
    }

    if (session.tryout.owner.role === "TEACHER") {
      return `Guru: ${session.tryout.owner.name}`;
    }

    return session.tryout.owner.name;
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function openSession() {
    if (session.status === "FINISHED") {
      await goto(`/student/results/${session.id}`);
      return;
    }

    await goto(`/student/tryouts/${session.id}`);
  }
</script>

{#if variant === "table"}
  <tr
    class={`border-t border-slate-100 transition hover:bg-slate-50/70 ${
      !isFinished ? "bg-amber-50/20" : ""
    }`}
  >
    <td class="px-5 py-4">
      <div class="max-w-[320px]">
        <div class="flex items-start gap-2">
          {#if !isFinished}
            <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400"
            ></span>
          {/if}

          <div class="min-w-0">
            <p class="font-black leading-5 text-slate-950">
              {session.tryout.title}
            </p>

            <p class="mt-1 text-xs font-semibold text-slate-400">
              {session.tryout.subject.name}
            </p>

            <p class="mt-0.5 text-[11px] text-slate-400">
              {formatDate(session.startedAt)}
            </p>
          </div>
        </div>
      </div>
    </td>

    <td class="px-5 py-4">
      <p class="text-xs font-bold leading-5 text-slate-600">
        {getOwnerLabel()}
      </p>
    </td>

    <td class="px-5 py-4">
      <span
        class="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-black text-slate-800"
      >
        #{session.attemptNumber}
      </span>
    </td>

    <td class="px-5 py-4">
      <span
        class={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ${
          isFinished
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        <span
          class={`h-1.5 w-1.5 rounded-full ${
            isFinished ? "bg-emerald-500" : "bg-amber-500"
          }`}
        ></span>

        {isFinished ? "Selesai" : "Berlangsung"}
      </span>
    </td>

    <td class="px-5 py-4">
      <div class="min-w-[120px]">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-black text-slate-700">
            {answeredCount}/{session.totalQuestions}
          </span>

          <span class="text-[10px] font-bold text-slate-400">
            {progressPercentage}%
          </span>
        </div>

        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            class={`h-full rounded-full ${
              isFinished ? "bg-emerald-500" : "bg-[#f8c900]"
            }`}
            style={`width: ${progressPercentage}%`}
          ></div>
        </div>
      </div>
    </td>

    <td class="px-5 py-4">
      <p class="text-xs font-bold text-slate-700">
        {getDifficultyLabel(session.initialLevel)}
      </p>
    </td>

    <td class="px-5 py-4">
      <p class="text-xs font-bold text-slate-700">
        {getDifficultyLabel(session.currentLevel)}
      </p>
    </td>

    <td class="px-5 py-4">
      <div>
        <p
          class={`text-lg font-black ${
            isFinished ? "text-[#0c438c]" : "text-slate-700"
          }`}
        >
          {session.score}
        </p>

        {#if !isFinished}
          <p class="text-[10px] font-semibold text-slate-400">sementara</p>
        {/if}
      </div>
    </td>

    <td class="px-5 py-4 text-right">
      <button
        type="button"
        onclick={openSession}
        class={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition ${
          isFinished
            ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            : "bg-[#062b63] text-white hover:bg-[#0c438c]"
        }`}
      >
        {isFinished ? "Lihat Hasil" : "Lanjutkan"}

        <svg
          class="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </td>
  </tr>
{:else}
  <article
    class={`relative overflow-hidden rounded-2xl border bg-white shadow-sm ${
      isFinished ? "border-slate-200" : "border-amber-200"
    }`}
  >
    <div
      class={`absolute inset-x-0 top-0 h-1 ${
        isFinished ? "bg-emerald-500" : "bg-[#f8c900]"
      }`}
    ></div>

    <div class="p-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p
            class="text-[10px] font-black uppercase tracking-[0.15em] text-[#0c438c]"
          >
            Attempt #{session.attemptNumber}
          </p>

          <h3 class="mt-1 text-lg font-black leading-6 text-slate-950">
            {session.tryout.title}
          </h3>
        </div>

        <span
          class={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${
            isFinished
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {isFinished ? "Selesai" : "Berlangsung"}
        </span>
      </div>

      <div class="mt-4 space-y-2">
        <div class="flex items-start gap-2 text-xs">
          <svg
            class="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z" />
            <path d="M7 16h12" />
          </svg>

          <div>
            <span class="text-slate-400">Bank:</span>

            <span class="ml-1 font-bold text-slate-700">
              {session.tryout.subject.name}
            </span>
          </div>
        </div>

        <div class="flex items-start gap-2 text-xs">
          <svg
            class="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <circle cx="12" cy="8" r="3" />
            <path d="M6 20c.5-4 2.5-6 6-6s5.5 2 6 6" />
          </svg>

          <div>
            <span class="text-slate-400">Pemilik:</span>

            <span class="ml-1 font-bold text-slate-700">
              {getOwnerLabel()}
            </span>
          </div>
        </div>
      </div>

      <div class="mt-4 rounded-xl bg-slate-50 p-3.5">
        <div class="flex items-center justify-between gap-3">
          <p
            class="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
          >
            Progress
          </p>

          <p class="text-xs font-black text-slate-700">
            {answeredCount}/{session.totalQuestions}
          </p>
        </div>

        <div class="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            class={`h-full rounded-full ${
              isFinished ? "bg-emerald-500" : "bg-[#f8c900]"
            }`}
            style={`width: ${progressPercentage}%`}
          ></div>
        </div>

        <p class="mt-2 text-right text-[10px] font-bold text-slate-400">
          {progressPercentage}% selesai
        </p>
      </div>

      <div class="mt-4 grid grid-cols-3 gap-2">
        <div class="rounded-xl bg-slate-50 p-3">
          <p
            class="text-[9px] font-black uppercase tracking-wide text-slate-400"
          >
            Level Awal
          </p>

          <p class="mt-1 text-sm font-black text-slate-900">
            {getDifficultyLabel(session.initialLevel)}
          </p>
        </div>

        <div class="rounded-xl bg-slate-50 p-3">
          <p
            class="text-[9px] font-black uppercase tracking-wide text-slate-400"
          >
            Level Akhir
          </p>

          <p class="mt-1 text-sm font-black text-slate-900">
            {getDifficultyLabel(session.currentLevel)}
          </p>
        </div>

        <div class="rounded-xl bg-slate-50 p-3">
          <p
            class="text-[9px] font-black uppercase tracking-wide text-slate-400"
          >
            Nilai
          </p>

          <p class="mt-1 text-sm font-black text-[#0c438c]">
            {session.score}
          </p>
        </div>
      </div>

      <div
        class="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4"
      >
        <p class="text-[11px] font-semibold text-slate-400">
          {formatDate(session.startedAt)}
        </p>

        <button
          type="button"
          onclick={openSession}
          class={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black ${
            isFinished
              ? "border border-slate-200 bg-white text-slate-700"
              : "bg-[#062b63] text-white"
          }`}
        >
          {isFinished ? "Lihat Hasil" : "Lanjutkan"}
        </button>
      </div>
    </div>
  </article>
{/if}
