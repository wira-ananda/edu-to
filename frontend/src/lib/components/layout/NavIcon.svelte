<script lang="ts">
  import type { AppNavIcon } from "$lib/types/navigation";

  type Props = {
    name: AppNavIcon;
    className?: string;
  };

  let { name, className = "h-5 w-5" }: Props = $props();
</script>

{#if name === "dashboard"}
  <svg
    class={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
  >
    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
  </svg>
{:else if name === "book-open"}
  <svg
    class={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
  >
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
    <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21.5z" />
  </svg>
{:else if name === "plus-circle"}
  <svg
    class={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </svg>
{:else if name === "activity"}
  <svg
    class={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
  >
    <path d="M4 13h4l2-6 4 12 2-6h4" />
  </svg>
{:else if name === "file-text"}
  <svg
    class={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
  >
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
{:else if name === "settings"}
  <svg
    class={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
  >
    <circle cx="12" cy="12" r="3" />
    <path
      d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.04.04-2 3.46-.06-.02a1.8 1.8 0 0 0-2.12.44l-.08.08-3.02-1.74V19a1.8 1.8 0 0 0-1.8-1.8h-.14L7.6 18.94l-.08-.08a1.8 1.8 0 0 0-2.12-.44l-.06.02-2-3.46.04-.04A1.8 1.8 0 0 0 3.74 13H3.6V9h.14a1.8 1.8 0 0 0 1.64-1.04l.04-.08L3.4 4.42l2-3.46.06.02a1.8 1.8 0 0 0 2.12-.44l.08-.08 3.02 1.74V2.4a1.8 1.8 0 0 0 1.8 1.8h.14l3.02-1.74.08.08a1.8 1.8 0 0 0 2.12.44l.06-.02 2 3.46-2.02 3.46.04.08A1.8 1.8 0 0 0 20.26 9h.14v4h-.14A1.8 1.8 0 0 0 19.4 15z"
    />
  </svg>
{:else if name === "play-circle"}
  <svg
    class={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="m10 8 6 4-6 4z" />
  </svg>
{:else if name === "history"}
  <svg
    class={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
  >
    <path d="M4 12a8 8 0 1 0 2.34-5.66L4 8.7" />
    <path d="M4 4v4.7h4.7M12 7v5l3 2" />
  </svg>
{:else if name === "trophy"}
  <svg
    class={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
  >
    <path d="M8 4h8v4a4 4 0 0 1-8 0z" />
    <path
      d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 12v5M9 21h6M10 17h4"
    />
  </svg>
{:else}
  <svg
    class={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
{/if}
