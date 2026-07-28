<script lang="ts">
  type Tone = "default" | "blue" | "green" | "amber" | "red";

  type Props = {
    label: string;
    value: string | number;
    helper?: string;
    tone?: Tone;
    badge?: string;
    badgeTone?: Tone;
  };

  let {
    label,
    value,
    helper = "",
    tone = "default",
    badge = "",
    badgeTone = "default",
  }: Props = $props();

  const valueClasses: Record<Tone, string> = {
    default: "text-slate-950",
    blue: "text-[#123c8c]",
    green: "text-emerald-700",
    amber: "text-amber-700",
    red: "text-red-600",
  };

  const badgeClasses: Record<Tone, string> = {
    default: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-[#123c8c]",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
  };
</script>

<article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div class="flex items-start justify-between gap-3">
    <p class="text-sm font-semibold text-slate-500">
      {label}
    </p>

    {#if badge}
      <span
        class={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
          badgeClasses[badgeTone]
        }`}
      >
        {badge}
      </span>
    {/if}
  </div>

  <p class={`mt-2 text-3xl font-black tracking-tight ${valueClasses[tone]}`}>
    {value}
  </p>

  {#if helper}
    <p class="mt-1.5 text-xs font-medium leading-5 text-slate-400">
      {helper}
    </p>
  {/if}
</article>
