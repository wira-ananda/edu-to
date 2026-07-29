<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import {
    getAdminTeacherAccountsCached,
    invalidateAdminTeacherAccountsCache,
    readAdminTeacherAccountsCache,
  } from "$lib/cache/admin-page-cache";

  import type { MutateTeacherResponse, TeacherAccount } from "$lib/types/users";

  let loading = $state(true);
  let refreshing = $state(false);
  let deletingId = $state("");

  let errorMessage = $state("");
  let successMessage = $state("");

  let teachers = $state<TeacherAccount[]>([]);

  async function loadTeachers(options: { force?: boolean } = {}) {
    const force = options.force ?? false;

    errorMessage = "";

    const cachedTeachers = !force ? readAdminTeacherAccountsCache() : null;

    if (cachedTeachers) {
      teachers = cachedTeachers;
      loading = false;
      return;
    }

    loading = teachers.length === 0;

    try {
      teachers = await getAdminTeacherAccountsCached({
        force,
      });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat akun guru.";
    } finally {
      loading = false;
    }
  }

  async function refreshTeachers() {
    refreshing = true;
    successMessage = "";

    invalidateAdminTeacherAccountsCache();

    try {
      await loadTeachers({
        force: true,
      });
    } finally {
      refreshing = false;
    }
  }

  async function deleteTeacher(teacher: TeacherAccount) {
    const confirmed = confirm(`Hapus akun guru ${teacher.name}?`);

    if (!confirmed) {
      return;
    }

    deletingId = teacher.id;

    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<MutateTeacherResponse>(
        `/admin/users/teachers/${teacher.id}`,
        {
          method: "DELETE",
        },
      );

      successMessage = result.message;

      invalidateAdminTeacherAccountsCache();

      await loadTeachers({
        force: true,
      });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus akun guru.";
    } finally {
      deletingId = "";
    }
  }

  function formatDate(value: string | Date) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  }

  onMount(() => {
    void loadTeachers();
  });
</script>

<section class="space-y-6">
  <!-- Header -->
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <p class="text-xs font-bold uppercase tracking-[0.16em] text-[#0d438d]">
        Pengguna
      </p>

      <h1
        class="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
      >
        Akun Guru
      </h1>

      <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Kelola akun guru yang memiliki akses ke panel guru dan bank soal
        miliknya.
      </p>
    </div>

    <div class="flex shrink-0 flex-wrap gap-2">
      <button
        type="button"
        onclick={refreshTeachers}
        disabled={loading || refreshing}
        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {refreshing ? "Memuat..." : "Refresh"}
      </button>

      <button
        type="button"
        onclick={() => goto("/admin/users/new")}
        class="rounded-xl bg-[#123b8f] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0d327d]"
      >
        + Tambah Guru
      </button>
    </div>
  </div>

  <!-- Messages -->
  {#if errorMessage}
    <div
      class="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </div>
  {/if}

  {#if successMessage}
    <div
      class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
    >
      {successMessage}
    </div>
  {/if}

  <!-- Content -->
  <div
    class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
  >
    {#if loading}
      <div class="flex min-h-52 items-center justify-center p-8">
        <div class="text-center">
          <div
            class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#0d438d]"
          ></div>

          <p class="mt-3 text-sm font-semibold text-slate-500">
            Memuat akun guru...
          </p>
        </div>
      </div>
    {:else if teachers.length === 0}
      <div class="flex min-h-64 items-center justify-center p-8">
        <div class="max-w-sm text-center">
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0d438d]"
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

          <h2 class="mt-4 font-bold text-slate-900">Belum ada akun guru</h2>

          <p class="mt-1 text-sm leading-6 text-slate-500">
            Tambahkan guru untuk memberikan akses ke panel guru.
          </p>

          <button
            type="button"
            onclick={() => goto("/admin/users/new")}
            class="mt-5 rounded-xl bg-[#123b8f] px-5 py-2.5 text-sm font-bold text-white"
          >
            Tambah Guru
          </button>
        </div>
      </div>
    {:else}
      <!-- Desktop -->
      <div class="hidden overflow-x-auto md:block">
        <table class="w-full text-left text-sm">
          <thead
            class="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"
          >
            <tr>
              <th class="px-5 py-4">Guru</th>
              <th class="px-5 py-4">Sekolah</th>
              <th class="px-5 py-4">Role</th>
              <th class="px-5 py-4">Dibuat</th>
              <th class="px-5 py-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100">
            {#each teachers as teacher}
              <tr class="transition hover:bg-slate-50/70">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffca05] text-xs font-black text-[#062b63]"
                    >
                      {teacher.name
                        .trim()
                        .split(" ")
                        .slice(0, 2)
                        .map((word) => word[0]?.toUpperCase() ?? "")
                        .join("")}
                    </div>

                    <div class="min-w-0">
                      <p class="truncate font-bold text-slate-900">
                        {teacher.name}
                      </p>

                      <p class="mt-0.5 truncate text-xs text-slate-500">
                        {teacher.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td class="px-5 py-4">
                  <span class="font-medium text-slate-600">
                    {teacher.school ?? "-"}
                  </span>
                </td>

                <td class="px-5 py-4">
                  <span
                    class="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-[#123b8f]"
                  >
                    {teacher.role}
                  </span>
                </td>

                <td class="px-5 py-4 text-slate-500">
                  {formatDate(teacher.createdAt)}
                </td>

                <td class="px-5 py-4 text-right">
                  <button
                    type="button"
                    disabled={deletingId === teacher.id}
                    onclick={() => deleteTeacher(teacher)}
                    class="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === teacher.id ? "Menghapus..." : "Hapus"}
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Mobile -->
      <div class="divide-y divide-slate-100 md:hidden">
        {#each teachers as teacher}
          <article class="p-5">
            <div class="flex items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ffca05] text-xs font-black text-[#062b63]"
              >
                {teacher.name
                  .trim()
                  .split(" ")
                  .slice(0, 2)
                  .map((word) => word[0]?.toUpperCase() ?? "")
                  .join("")}
              </div>

              <div class="min-w-0 flex-1">
                <p class="font-bold text-slate-900">
                  {teacher.name}
                </p>

                <p class="mt-0.5 break-all text-xs text-slate-500">
                  {teacher.email}
                </p>
              </div>

              <span
                class="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#123b8f]"
              >
                {teacher.role}
              </span>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-xs font-semibold text-slate-400">Sekolah</p>

                <p class="mt-1 font-semibold text-slate-700">
                  {teacher.school ?? "-"}
                </p>
              </div>

              <div>
                <p class="text-xs font-semibold text-slate-400">Dibuat</p>

                <p class="mt-1 font-semibold text-slate-700">
                  {formatDate(teacher.createdAt)}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={deletingId === teacher.id}
              onclick={() => deleteTeacher(teacher)}
              class="mt-4 w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-50"
            >
              {deletingId === teacher.id ? "Menghapus..." : "Hapus Akun"}
            </button>
          </article>
        {/each}
      </div>
    {/if}
  </div>
</section>
