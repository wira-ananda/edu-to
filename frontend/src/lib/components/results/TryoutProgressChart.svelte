<script lang="ts">
  import type { TryoutProgressCurveItem } from "$lib/types/admin";

  type Props = {
    items: TryoutProgressCurveItem[];
  };

  let { items }: Props = $props();

  const width = 760;
  const height = 250;

  const paddingLeft = 48;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 44;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const axisValues = [100, 75, 50, 25, 0];

  function clampScore(score: number) {
    return Math.max(0, Math.min(100, score));
  }

  function getY(score: number) {
    return paddingTop + ((100 - clampScore(score)) / 100) * innerHeight;
  }

  const points = $derived.by(() => {
    return items.map((item, index) => {
      const x =
        items.length === 1
          ? paddingLeft + innerWidth / 2
          : paddingLeft + (index / (items.length - 1)) * innerWidth;

      return {
        ...item,
        x,
        y: getY(item.averageScore),
      };
    });
  });

  const polylinePoints = $derived(
    points.map((point) => `${point.x},${point.y}`).join(" "),
  );

  const firstScore = $derived(items[0]?.averageScore ?? 0);

  const latestScore = $derived(
    items.length > 0 ? (items[items.length - 1]?.averageScore ?? 0) : 0,
  );

  const scoreDifference = $derived(latestScore - firstScore);

  const differenceLabel = $derived.by(() => {
    if (items.length < 2) {
      return "Belum cukup data untuk membandingkan tren.";
    }

    if (scoreDifference > 0) {
      return `Naik ${scoreDifference} poin dari percobaan pertama.`;
    }

    if (scoreDifference < 0) {
      return `Turun ${Math.abs(scoreDifference)} poin dari percobaan pertama.`;
    }

    return "Nilai rata-rata tidak berubah.";
  });
</script>

<div
  class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
>
  <div
    class="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <p class="text-xs font-black uppercase tracking-[0.15em] text-[#123c8c]">
        Tren Performa
      </p>

      <h3 class="mt-1 text-lg font-black text-slate-950">
        Perkembangan Nilai per Percobaan
      </h3>

      <p class="mt-1 text-sm text-slate-500">
        Perubahan rata-rata nilai peserta pada setiap percobaan.
      </p>
    </div>

    {#if items.length >= 2}
      <span
        class={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
          scoreDifference > 0
            ? "bg-emerald-50 text-emerald-700"
            : scoreDifference < 0
              ? "bg-red-50 text-red-600"
              : "bg-slate-100 text-slate-600"
        }`}
      >
        {scoreDifference > 0 ? "+" : ""}{scoreDifference} poin
      </span>
    {/if}
  </div>

  {#if items.length === 0}
    <div class="p-8 text-center">
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
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="m7 15 4-4 3 2 5-6" />
        </svg>
      </div>

      <p class="mt-3 text-sm font-bold text-slate-700">
        Belum ada data performa
      </p>

      <p class="mt-1 text-sm text-slate-500">
        Grafik akan muncul setelah peserta menyelesaikan tryout.
      </p>
    </div>
  {:else}
    <div class="p-5 sm:p-6">
      <div class="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          class="min-w-[620px] w-full"
          role="img"
          aria-label="Grafik perkembangan rata-rata nilai setiap percobaan"
        >
          <title>
            Perkembangan rata-rata nilai peserta berdasarkan percobaan
          </title>

          {#each axisValues as axisValue}
            {@const y = getY(axisValue)}

            <line
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              stroke-width="1"
            />

            <text
              x={paddingLeft - 12}
              y={y + 4}
              text-anchor="end"
              font-size="11"
              fill="#94a3b8"
              font-weight="600"
            >
              {axisValue}
            </text>
          {/each}

          {#if points.length > 1}
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#123c8c"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          {/if}

          {#each points as point}
            <line
              x1={point.x}
              x2={point.x}
              y1={point.y}
              y2={paddingTop + innerHeight}
              stroke="#dbeafe"
              stroke-width="1"
              stroke-dasharray="4 5"
            />

            <circle
              cx={point.x}
              cy={point.y}
              r="7"
              fill="#123c8c"
              stroke="white"
              stroke-width="4"
            />

            <text
              x={point.x}
              y={point.y - 15}
              text-anchor="middle"
              font-size="12"
              fill="#123c8c"
              font-weight="800"
            >
              {point.averageScore}
            </text>

            <text
              x={point.x}
              y={height - 15}
              text-anchor="middle"
              font-size="11"
              fill="#64748b"
              font-weight="700"
            >
              #{point.attemptNumber}
            </text>
          {/each}
        </svg>
      </div>

      <div class="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <p class="text-sm font-semibold text-[#123c8c]">
          {differenceLabel}
        </p>
      </div>

      <details class="mt-5 rounded-xl border border-slate-200">
        <summary
          class="cursor-pointer px-4 py-3 text-sm font-bold text-slate-700"
        >
          Lihat detail angka per percobaan
        </summary>

        <div class="overflow-x-auto border-t border-slate-100">
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead
              class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"
            >
              <tr>
                <th scope="col" class="px-4 py-3">Percobaan</th>
                <th scope="col" class="px-4 py-3">Sesi Selesai</th>
                <th scope="col" class="px-4 py-3">Nilai</th>
                <th scope="col" class="px-4 py-3">Benar</th>
                <th scope="col" class="px-4 py-3">Salah</th>
                <th scope="col" class="px-4 py-3">Penyelesaian</th>
              </tr>
            </thead>

            <tbody>
              {#each items as item}
                <tr class="border-t border-slate-100">
                  <td class="px-4 py-3 font-bold text-slate-900">
                    #{item.attemptNumber}
                  </td>

                  <td class="px-4 py-3 text-slate-600">
                    {item.totalFinishedSessions}
                  </td>

                  <td class="px-4 py-3 font-black text-[#123c8c]">
                    {item.averageScore}
                  </td>

                  <td class="px-4 py-3 font-bold text-emerald-700">
                    {item.averageCorrect}
                  </td>

                  <td class="px-4 py-3 font-bold text-red-600">
                    {item.averageWrong}
                  </td>

                  <td class="px-4 py-3 font-semibold text-slate-700">
                    {item.completionRate}%
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  {/if}
</div>
