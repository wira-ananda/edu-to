<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import {
    getStudentTryoutsCached,
    invalidateStudentSessionsCache,
    invalidateStudentTryoutsCache,
    readStudentTryoutsCache,
  } from "$lib/cache/student-page-cache";

  import StudentJoinCodeCard from "$lib/components/tryouts/StudentJoinCodeCard.svelte";
  import StudentTryoutCard from "$lib/components/tryouts/StudentTryoutCard.svelte";

  import type {
    JoinTryoutByCodeResponse,
    RequestJoinTryoutResponse,
    StartTryoutResponse,
    StudentTryoutItem,
  } from "$lib/types/student";

  type TryoutTab = "MY" | "AVAILABLE";

  let loading = $state(true);
  let refreshing = $state(false);
  let joiningByCode = $state(false);

  let startingTryoutId = $state("");
  let requestingJoinTryoutId = $state("");

  let joinCode = $state("");

  let errorMessage = $state("");
  let successMessage = $state("");

  let tryouts = $state<StudentTryoutItem[]>([]);

  let activeTab = $state<TryoutTab>("MY");
  let tabInitialized = $state(false);

  const myTryouts = $derived(
    tryouts.filter((tryout) => tryout.enrollmentStatus === "APPROVED"),
  );

  const availableTryouts = $derived(
    tryouts.filter((tryout) => tryout.enrollmentStatus !== "APPROVED"),
  );

  const pendingTryoutsCount = $derived(
    availableTryouts.filter((tryout) => tryout.enrollmentStatus === "PENDING")
      .length,
  );

  const displayedTryouts = $derived(
    activeTab === "MY" ? myTryouts : availableTryouts,
  );

  const activeTryoutsCount = $derived(
    myTryouts.filter(
      (tryout) => Boolean(tryout.ongoingSessionId) || tryout.canStart,
    ).length,
  );

  function isValidEnrollmentCache(cachedTryouts: StudentTryoutItem[]) {
    return cachedTryouts.every(
      (tryout) =>
        "enrollmentStatus" in tryout &&
        "attemptsUsed" in tryout &&
        "canStart" in tryout,
    );
  }

  function initializeTab() {
    if (tabInitialized) {
      return;
    }

    activeTab = myTryouts.length > 0 ? "MY" : "AVAILABLE";
    tabInitialized = true;
  }

  function selectTab(tab: TryoutTab) {
    activeTab = tab;
    errorMessage = "";
    successMessage = "";
  }

  async function loadTryouts(
    options: {
      force?: boolean;
    } = {},
  ) {
    const force = options.force ?? false;

    errorMessage = "";

    const cachedTryouts = !force ? readStudentTryoutsCache() : null;

    if (cachedTryouts && isValidEnrollmentCache(cachedTryouts)) {
      tryouts = cachedTryouts;
      loading = false;

      initializeTab();

      return;
    }

    loading = tryouts.length === 0;

    try {
      tryouts = await getStudentTryoutsCached({
        force: force || Boolean(cachedTryouts),
      });

      initializeTab();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat daftar tryout.";
    } finally {
      loading = false;
    }
  }

  async function refreshTryouts() {
    refreshing = true;

    errorMessage = "";
    successMessage = "";

    invalidateStudentTryoutsCache();

    try {
      await loadTryouts({
        force: true,
      });
    } finally {
      refreshing = false;
    }
  }

  async function joinTryoutByCode(code: string) {
    const normalizedCode = code.trim().toUpperCase();

    if (normalizedCode.length !== 6) {
      errorMessage = "Kode tryout harus terdiri dari 6 karakter.";
      return;
    }

    joiningByCode = true;

    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<JoinTryoutByCodeResponse>(
        "/student/tryouts/join-by-code",
        {
          method: "POST",
          body: JSON.stringify({
            code: normalizedCode,
          }),
        },
      );

      successMessage = result.message;
      joinCode = "";

      invalidateStudentTryoutsCache();

      await loadTryouts({
        force: true,
      });

      /*
       * Join melalui kode langsung APPROVED,
       * jadi arahkan siswa ke Tryout Saya.
       */
      activeTab = "MY";
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal bergabung menggunakan kode tryout.";
    } finally {
      joiningByCode = false;
    }
  }

  async function requestJoinTryout(tryout: StudentTryoutItem) {
    requestingJoinTryoutId = tryout.id;

    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<RequestJoinTryoutResponse>(
        `/student/tryouts/${tryout.id}/request-join`,
        {
          method: "POST",
        },
      );

      successMessage = result.message;

      invalidateStudentTryoutsCache();

      await loadTryouts({
        force: true,
      });

      /*
       * Request join masih PENDING.
       * Tetap di Belum Bergabung agar siswa dapat melihat statusnya.
       */
      activeTab = "AVAILABLE";
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal mengirim permintaan bergabung.";
    } finally {
      requestingJoinTryoutId = "";
    }
  }

  async function handleTryoutAction(tryout: StudentTryoutItem) {
    if (tryout.canRequestJoin) {
      await requestJoinTryout(tryout);
      return;
    }

    if (tryout.ongoingSessionId) {
      await goto(`/student/tryouts/${tryout.ongoingSessionId}`);
      return;
    }

    startingTryoutId = tryout.id;

    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<StartTryoutResponse>(
        "/student/tryouts/start",
        {
          method: "POST",
          body: JSON.stringify({
            tryoutId: tryout.id,
          }),
        },
      );

      invalidateStudentSessionsCache();
      invalidateStudentTryoutsCache();

      await goto(`/student/tryouts/${result.session.id}`);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memulai tryout.";
    } finally {
      startingTryoutId = "";
    }
  }

  onMount(() => {
    void loadTryouts();
  });
</script>

<section class="space-y-6">
  <!-- Page Header -->
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
        Mulai Tryout
      </h2>

      <p class="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
        Kerjakan tryout yang sudah kamu ikuti atau cari tryout lain yang
        tersedia.
      </p>
    </div>

    <button
      type="button"
      onclick={refreshTryouts}
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

  <!-- Join Code -->
  <StudentJoinCodeCard
    bind:value={joinCode}
    loading={joiningByCode}
    disabled={loading}
    onSubmit={joinTryoutByCode}
  />

  <!-- Error -->
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

      <div class="min-w-0">
        <p class="text-sm font-bold text-red-700">Tidak dapat memproses</p>

        <p class="mt-0.5 text-sm leading-5 text-red-600">
          {errorMessage}
        </p>
      </div>
    </div>
  {/if}

  <!-- Success -->
  {#if successMessage}
    <div
      class="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5"
    >
      <div
        class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
      >
        <svg
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="m8 12 2.5 2.5L16 9" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>

      <div class="min-w-0">
        <p class="text-sm font-bold text-emerald-800">Berhasil</p>

        <p class="mt-0.5 text-sm leading-5 text-emerald-700">
          {successMessage}
        </p>
      </div>
    </div>
  {/if}

  {#if loading}
    <!-- Skeleton -->
    <section class="space-y-4">
      <div
        class="h-14 animate-pulse rounded-2xl border border-slate-200 bg-white"
      ></div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each Array(3) as _}
          <div
            class="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <div class="h-1.5 animate-pulse bg-slate-200"></div>

            <div class="space-y-4 p-5">
              <div class="h-5 w-4/5 animate-pulse rounded bg-slate-200"></div>

              <div class="h-4 w-1/2 animate-pulse rounded bg-slate-100"></div>

              <div class="h-20 animate-pulse rounded-xl bg-slate-100"></div>

              <div class="grid grid-cols-2 gap-2">
                <div class="h-20 animate-pulse rounded-xl bg-slate-100"></div>
                <div class="h-20 animate-pulse rounded-xl bg-slate-100"></div>
                <div class="h-20 animate-pulse rounded-xl bg-slate-100"></div>
                <div class="h-20 animate-pulse rounded-xl bg-slate-100"></div>
              </div>

              <div class="h-11 animate-pulse rounded-xl bg-slate-200"></div>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {:else if tryouts.length === 0}
    <!-- Global empty state -->
    <div
      class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
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
          <path d="M8 6h8" />
          <path d="M8 10h8" />
          <path d="M8 14h5" />
          <rect x="4" y="3" width="16" height="18" rx="2" />
        </svg>
      </div>

      <h3 class="mt-4 text-lg font-black text-slate-950">Belum ada tryout</h3>

      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Belum ada tryout yang sedang dibuka. Jika sudah mendapat kode dari guru,
        kamu tetap dapat memasukkannya di atas.
      </p>
    </div>
  {:else}
    <!-- Tabs -->
    <div
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div
        class="flex overflow-x-auto border-b border-slate-200 px-2 sm:px-4"
        role="tablist"
        aria-label="Kategori tryout"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "MY"}
          onclick={() => selectTab("MY")}
          class={`relative flex min-w-max items-center gap-2 px-4 py-4 text-sm font-bold transition sm:px-5 ${
            activeTab === "MY"
              ? "text-[#062b63]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="m9 12 2 2 4-4" />
          </svg>

          <span>Tryout Saya</span>

          <span
            class={`rounded-full px-2 py-0.5 text-[10px] font-black ${
              activeTab === "MY"
                ? "bg-blue-50 text-[#0c438c]"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {myTryouts.length}
          </span>

          {#if activeTab === "MY"}
            <span
              class="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#0c438c]"
            ></span>
          {/if}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "AVAILABLE"}
          onclick={() => selectTab("AVAILABLE")}
          class={`relative flex min-w-max items-center gap-2 px-4 py-4 text-sm font-bold transition sm:px-5 ${
            activeTab === "AVAILABLE"
              ? "text-[#062b63]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>

          <span>Belum Bergabung</span>

          <span
            class={`rounded-full px-2 py-0.5 text-[10px] font-black ${
              activeTab === "AVAILABLE"
                ? "bg-blue-50 text-[#0c438c]"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {availableTryouts.length}
          </span>

          {#if pendingTryoutsCount > 0}
            <span
              class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700"
            >
              {pendingTryoutsCount} menunggu
            </span>
          {/if}

          {#if activeTab === "AVAILABLE"}
            <span
              class="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#0c438c]"
            ></span>
          {/if}
        </button>
      </div>

      <!-- Tab summary -->
      <div class="bg-slate-50/70 px-4 py-3 sm:px-5">
        {#if activeTab === "MY"}
          <div
            class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p class="text-sm font-bold text-slate-800">
                Tryout yang sudah kamu ikuti
              </p>

              <p class="mt-0.5 text-xs text-slate-500">
                Mulai tryout baru atau lanjutkan sesi yang belum selesai.
              </p>
            </div>

            {#if myTryouts.length > 0}
              <span
                class="mt-2 w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 sm:mt-0"
              >
                {activeTryoutsCount} bisa dikerjakan
              </span>
            {/if}
          </div>
        {:else}
          <div>
            <p class="text-sm font-bold text-slate-800">
              Tryout lain yang tersedia
            </p>

            <p class="mt-0.5 text-xs text-slate-500">
              Minta akses kepada guru atau tunggu persetujuan jika permintaan
              sudah dikirim.
            </p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Active tab content -->
    {#if displayedTryouts.length === 0}
      {#if activeTab === "MY"}
        <div
          class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center"
        >
          <div
            class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0c438c]"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M8 6h8" />
              <path d="M8 10h8" />
              <path d="M8 14h5" />
              <rect x="4" y="3" width="16" height="18" rx="2" />
            </svg>
          </div>

          <h3 class="mt-4 font-black text-slate-950">Belum ada Tryout Saya</h3>

          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Kamu belum bergabung ke tryout mana pun. Cari tryout yang tersedia
            atau gunakan kode dari guru.
          </p>

          <button
            type="button"
            onclick={() => selectTab("AVAILABLE")}
            class="mt-5 rounded-xl bg-[#062b63] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0c438c]"
          >
            Lihat Tryout Tersedia
          </button>
        </div>
      {:else}
        <div
          class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center"
        >
          <div
            class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="m8 12 2.5 2.5L16 9" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>

          <h3 class="mt-4 font-black text-slate-950">
            Semua tryout sudah kamu ikuti
          </h3>

          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Tidak ada tryout lain yang perlu kamu daftarkan saat ini.
          </p>

          <button
            type="button"
            onclick={() => selectTab("MY")}
            class="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700"
          >
            Kembali ke Tryout Saya
          </button>
        </div>
      {/if}
    {:else}
      <div class="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each displayedTryouts as tryout (tryout.id)}
          <StudentTryoutCard
            {tryout}
            starting={startingTryoutId === tryout.id}
            requesting={requestingJoinTryoutId === tryout.id}
            onAction={handleTryoutAction}
          />
        {/each}
      </div>
    {/if}

    <!-- System Information -->
    <div
      class="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3.5"
    >
      <div
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#0c438c]"
      >
        <svg
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
      </div>

      <div>
        <p class="text-xs font-black text-[#062b63]">
          Tentang pengerjaan tryout
        </p>

        <p class="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
          Sistem menentukan tingkat awal soal secara otomatis dan menyesuaikan
          pemilihan soal selama pengerjaan berlangsung.
        </p>
      </div>
    </div>
  {/if}
</section>
