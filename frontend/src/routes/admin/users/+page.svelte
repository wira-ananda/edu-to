<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import {
    getAdminTeacherAccountsCached,
    invalidateAdminTeacherAccountsCache,
    readAdminTeacherAccountsCache,
  } from "$lib/cache/admin-page-cache";
  import type { TeacherAccount, MutateTeacherResponse } from "$lib/types/users";

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
      teachers = await getAdminTeacherAccountsCached({ force });
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
      await loadTeachers({ force: true });
    } finally {
      refreshing = false;
    }
  }

  async function deleteTeacher(id: string) {
    const confirmed = confirm("Hapus akun guru ini?");

    if (!confirmed) return;

    deletingId = id;
    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<MutateTeacherResponse>(
        `/admin/users/teachers/${id}`,
        {
          method: "DELETE",
        },
      );

      successMessage = result.message;
      invalidateAdminTeacherAccountsCache();

      await loadTeachers({ force: true });
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus akun guru.";
    } finally {
      deletingId = "";
    }
  }

  onMount(() => {
    void loadTeachers();
  });
</script>

<section class="space-y-5">
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
  >
    <div>
      <h2 class="text-2xl font-bold text-slate-950">Akun Guru</h2>
      <p class="mt-1 text-sm text-slate-500">
        Kelola akun guru yang dapat mengakses panel admin.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        onclick={refreshTeachers}
        disabled={loading || refreshing}
        class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"
      >
        {refreshing ? "Memuat..." : "Refresh"}
      </button>

      <button
        type="button"
        onclick={() => goto("/admin/users/new")}
        class="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-bold text-white"
      >
        + Tambah Guru
      </button>
    </div>
  </div>

  {#if errorMessage}
    <p
      class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
    >
      {errorMessage}
    </p>
  {/if}

  {#if successMessage}
    <p
      class="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
    >
      {successMessage}
    </p>
  {/if}

  <div
    class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
  >
    <table class="w-full text-left text-sm">
      <thead
        class="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"
      >
        <tr>
          <th class="px-5 py-4">Nama</th>
          <th class="px-5 py-4">Email</th>
          <th class="px-5 py-4">Sekolah</th>
          <th class="px-5 py-4">Role Sistem</th>
          <th class="px-5 py-4">Tanggal Dibuat</th>
          <th class="px-5 py-4">Aksi</th>
        </tr>
      </thead>

      <tbody>
        {#if loading}
          <tr>
            <td colspan="6" class="px-5 py-10 text-center text-slate-500">
              Memuat akun guru...
            </td>
          </tr>
        {:else if teachers.length === 0}
          <tr>
            <td colspan="6" class="px-5 py-10 text-center text-slate-500">
              Belum ada akun guru.
            </td>
          </tr>
        {:else}
          {#each teachers as teacher}
            <tr class="border-t border-slate-100">
              <td class="px-5 py-4">
                <p class="font-bold text-slate-900">{teacher.name}</p>
              </td>

              <td class="px-5 py-4 font-semibold text-slate-700">
                {teacher.email}
              </td>

              <td class="px-5 py-4 text-slate-600">
                {teacher.school ?? "-"}
              </td>

              <td class="px-5 py-4">
                <span
                  class="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900"
                >
                  Guru/Admin
                </span>
              </td>

              <td class="px-5 py-4 text-slate-500">
                {new Date(teacher.createdAt).toLocaleString("id-ID")}
              </td>

              <td class="px-5 py-4">
                <button
                  type="button"
                  disabled={deletingId === teacher.id}
                  onclick={() => deleteTeacher(teacher.id)}
                  class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 disabled:opacity-50"
                >
                  {deletingId === teacher.id ? "Menghapus..." : "Hapus"}
                </button>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</section>
