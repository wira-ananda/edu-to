<script lang="ts">
  import type {
    TryoutParticipantAttempt,
    TryoutParticipantItem,
  } from "$lib/types/admin";

  import {
    getEnrollmentStatusBadgeClass,
    getEnrollmentStatusLabel,
  } from "$lib/types/admin";

  type Props = {
    participant: TryoutParticipantItem;
    mutating?: boolean;
    onApprove: (enrollmentId: string) => void | Promise<void>;
    onReject: (enrollmentId: string) => void | Promise<void>;
  };

  let { participant, mutating = false, onApprove, onReject }: Props = $props();

  const latestAttempt = $derived(
    participant.attempts[participant.attempts.length - 1] ?? null,
  );

  function formatDate(value: string | null | undefined) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function getAttemptStatusLabel(status: "ONGOING" | "FINISHED") {
    return status === "FINISHED" ? "Selesai" : "Berlangsung";
  }

  function getAttemptStatusBadgeClass(status: "ONGOING" | "FINISHED") {
    return status === "FINISHED"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-amber-50 text-amber-700";
  }

  function getAttemptScoreLabel(attempt: TryoutParticipantAttempt | null) {
    if (!attempt) {
      return "-";
    }

    if (attempt.status === "ONGOING") {
      return "Belum selesai";
    }

    return String(attempt.score);
  }
</script>

<article class="rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div class="p-5">
    <div
      class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"
    >
      <div class="min-w-0 flex-1">
        <!-- Student -->
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-[#0c438c]"
              >
                {participant.student.name
                  .trim()
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((word) => word[0]?.toUpperCase() ?? "")
                  .join("")}
              </div>

              <div class="min-w-0">
                <h4 class="truncate font-black text-slate-950">
                  {participant.student.name}
                </h4>

                <p class="mt-0.5 truncate text-sm text-slate-500">
                  {participant.student.email}
                </p>
              </div>
            </div>

            <p class="mt-3 text-xs font-medium text-slate-400">
              {participant.student.school ?? "Sekolah belum diisi"}
              <span class="mx-1">·</span>
              {participant.student.className ?? "Kelas belum diisi"}
            </p>
          </div>

          <span
            class={`rounded-full px-3 py-1 text-xs font-bold ${getEnrollmentStatusBadgeClass(
              participant.status,
            )}`}
          >
            {getEnrollmentStatusLabel(participant.status)}
          </span>
        </div>

        <!-- Statistics -->
        <div class="mt-5 grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl bg-slate-50 p-3.5">
            <p
              class="text-[10px] font-black uppercase tracking-wide text-slate-400"
            >
              Percobaan
            </p>

            <p class="mt-1 text-lg font-black text-slate-950">
              {participant.attempts.length}
            </p>
          </div>

          <div class="rounded-xl bg-slate-50 p-3.5">
            <p
              class="text-[10px] font-black uppercase tracking-wide text-slate-400"
            >
              Nilai Terakhir
            </p>

            <p class="mt-1 text-lg font-black text-[#0c438c]">
              {getAttemptScoreLabel(latestAttempt)}
            </p>
          </div>

          <div class="rounded-xl bg-slate-50 p-3.5">
            <p
              class="text-[10px] font-black uppercase tracking-wide text-slate-400"
            >
              Bergabung
            </p>

            <p class="mt-1 text-xs font-bold leading-5 text-slate-600">
              {formatDate(participant.requestedAt)}
            </p>
          </div>
        </div>

        <!-- Attempts -->
        {#if participant.attempts.length > 0}
          <details
            class="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
          >
            <summary
              class="cursor-pointer select-none px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Riwayat percobaan ({participant.attempts.length})
            </summary>

            <div class="space-y-2 border-t border-slate-200 p-3">
              {#each participant.attempts as attempt}
                <div
                  class="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="text-xs font-black text-slate-900">
                        Percobaan #{attempt.attemptNumber}
                      </p>

                      <span
                        class={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getAttemptStatusBadgeClass(
                          attempt.status,
                        )}`}
                      >
                        {getAttemptStatusLabel(attempt.status)}
                      </span>
                    </div>

                    <p class="mt-1.5 text-xs leading-5 text-slate-500">
                      {attempt.answeredCount}/{attempt.totalQuestions}
                      dijawab
                      <span class="mx-1">·</span>
                      Benar {attempt.correctCount}
                      <span class="mx-1">·</span>
                      Salah {attempt.wrongCount}
                    </p>
                  </div>

                  <div class="sm:text-right">
                    <p
                      class="text-[10px] font-bold uppercase tracking-wide text-slate-400"
                    >
                      Nilai
                    </p>

                    <p class="text-xl font-black text-[#0c438c]">
                      {attempt.score}
                    </p>
                  </div>
                </div>
              {/each}
            </div>
          </details>
        {/if}
      </div>

      <!-- Actions -->
      <div class="flex shrink-0 flex-wrap gap-2 xl:w-36 xl:flex-col">
        {#if participant.status !== "APPROVED"}
          <button
            type="button"
            disabled={mutating}
            onclick={() => onApprove(participant.id)}
            class="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutating ? "Memproses..." : "Setujui"}
          </button>
        {/if}

        {#if participant.status !== "REJECTED"}
          <button
            type="button"
            disabled={mutating}
            onclick={() => onReject(participant.id)}
            class="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tolak
          </button>
        {/if}
      </div>
    </div>
  </div>
</article>
