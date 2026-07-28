<script lang="ts">
  import { onMount } from "svelte";
  import RoleDashboard from "$lib/components/dashboard/RoleDashboard.svelte";
  import {
    getTeacherQuestionBanksCached,
    getTeacherQuestionsCached,
    getTeacherTryoutsCached,
    readTeacherQuestionBanksCache,
    readTeacherQuestionsCache,
    readTeacherTryoutsCache,
  } from "$lib/cache/teacher-page-cache";
  import type {
    TeacherQuestionBanksResponse,
    TeacherQuestionsResponse,
    TeacherTryoutsResponse,
  } from "$lib/types/teacher";
  import type { DashboardAction, DashboardCard } from "$lib/types/dashboard";

  let loading = $state(true);
  let errorMessage = $state("");

  let totalBanks = $state(0);
  let totalQuestions = $state(0);
  let totalTryouts = $state(0);
  let openTryouts = $state(0);

  const cards = $derived.by<DashboardCard[]>(() => [
    {
      label: "Bank Soal",
      value: totalBanks,
      description: "Bank soal yang kamu kelola.",
      tone: "default",
    },
    {
      label: "Total Soal",
      value: totalQuestions,
      description: "Soal yang tersedia di seluruh bank.",
      tone: "blue",
    },
    {
      label: "Total Tryout",
      value: totalTryouts,
      description: "Seluruh tryout yang sudah dibuat.",
      tone: "yellow",
    },
    {
      label: "Tryout Dibuka",
      value: openTryouts,
      description: "Tryout yang saat ini dapat diakses siswa.",
      tone: "green",
    },
  ]);

  const actions: DashboardAction[] = [
    {
      title: "Kelola Bank Soal",
      description:
        "Kelola bank soal serta tambah, edit, atau hapus soal milikmu.",
      href: "/teacher/questions",
      label: "Buka Bank Soal",
      primary: true,
    },
    {
      title: "Kelola Tryout",
      description:
        "Atur tryout, kode bergabung, status, peserta, dan percobaan siswa.",
      href: "/teacher/tryouts",
      label: "Buka Tryout",
    },
    {
      title: "Hasil Siswa",
      description:
        "Pantau hasil pengerjaan dan perkembangan nilai peserta tryout.",
      href: "/teacher/results",
      label: "Lihat Hasil",
    },
  ];

  function applyDashboardData(
    banks: TeacherQuestionBanksResponse["banks"],
    questions: TeacherQuestionsResponse["questions"],
    tryouts: TeacherTryoutsResponse["tryouts"],
  ) {
    totalBanks = banks.length;
    totalQuestions = questions.length;
    totalTryouts = tryouts.length;

    openTryouts = tryouts.filter((tryout) => tryout.status === "OPEN").length;
  }

  async function loadDashboard() {
    errorMessage = "";

    const cachedBanks = readTeacherQuestionBanksCache();
    const cachedQuestions = readTeacherQuestionsCache();
    const cachedTryouts = readTeacherTryoutsCache();

    if (cachedBanks && cachedQuestions && cachedTryouts) {
      applyDashboardData(cachedBanks, cachedQuestions, cachedTryouts);

      loading = false;
      return;
    }

    loading = true;

    try {
      const [banks, questions, tryouts] = await Promise.all([
        getTeacherQuestionBanksCached(),
        getTeacherQuestionsCached(),
        getTeacherTryoutsCached(),
      ]);

      applyDashboardData(banks, questions, tryouts);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat dashboard.";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void loadDashboard();
  });
</script>

<RoleDashboard
  title="Dashboard Guru"
  description="Kelola bank soal, tryout, peserta, dan pantau perkembangan hasil siswa dari data milikmu."
  {cards}
  {actions}
  {loading}
  {errorMessage}
/>
