<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import QuestionBankManagement from "$lib/components/questions/QuestionBankManagement.svelte";

  import {
    getTeacherQuestionBanksCached,
    getTeacherQuestionsCached,
    invalidateTeacherQuestionBanksCache,
    invalidateTeacherQuestionDataCaches,
    invalidateTeacherQuestionsCache,
    invalidateTeacherSubjectsCache,
    readTeacherQuestionBanksCache,
    readTeacherQuestionsCache,
  } from "$lib/cache/teacher-page-cache";

  import type {
    TeacherQuestionBanksResponse,
    TeacherQuestionsResponse,
  } from "$lib/types/teacher";

  type CreateSubjectResponse = {
    ok: boolean;

    subject: {
      id: string;
      name: string;
    };
  };

  type DeleteSubjectResponse = {
    ok: boolean;
    message: string;
  };

  let loading = $state(true);
  let refreshing = $state(false);
  let creatingBank = $state(false);

  let deletingQuestionId = $state("");
  let deletingBankId = $state("");

  let errorMessage = $state("");
  let successMessage = $state("");

  let banks = $state<TeacherQuestionBanksResponse["banks"]>([]);
  let questions = $state<TeacherQuestionsResponse["questions"]>([]);

  let selectedBankId = $state("");

  const selectedBank = $derived(
    banks.find((bank) => bank.id === selectedBankId) ?? null,
  );

  const selectedQuestions = $derived(
    questions.filter((question) => question.subjectId === selectedBankId),
  );

  function resolveSelectedBank() {
    const requestedBankId = page.url.searchParams.get("bank");

    if (requestedBankId && banks.some((bank) => bank.id === requestedBankId)) {
      selectedBankId = requestedBankId;

      return;
    }

    if (selectedBankId && banks.some((bank) => bank.id === selectedBankId)) {
      return;
    }

    selectedBankId = banks[0]?.id ?? "";
  }

  async function loadData(
    options: {
      force?: boolean;
    } = {},
  ) {
    const force = options.force ?? false;

    errorMessage = "";

    const cachedBanks = !force ? readTeacherQuestionBanksCache() : null;

    const cachedQuestions = !force ? readTeacherQuestionsCache() : null;

    if (cachedBanks) {
      banks = cachedBanks;
    }

    if (cachedQuestions) {
      questions = cachedQuestions;
    }

    if (cachedBanks && cachedQuestions) {
      resolveSelectedBank();

      loading = false;

      return;
    }

    loading = banks.length === 0 && questions.length === 0;

    try {
      const [nextBanks, nextQuestions] = await Promise.all([
        getTeacherQuestionBanksCached({
          force,
        }),

        getTeacherQuestionsCached({
          force,
        }),
      ]);

      banks = nextBanks;
      questions = nextQuestions;

      resolveSelectedBank();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat bank soal.";
    } finally {
      loading = false;
    }
  }

  async function refreshData() {
    refreshing = true;

    errorMessage = "";
    successMessage = "";

    invalidateTeacherQuestionBanksCache();
    invalidateTeacherQuestionsCache();

    try {
      await loadData({
        force: true,
      });
    } finally {
      refreshing = false;
    }
  }

  async function selectBank(bankId: string) {
    selectedBankId = bankId;

    errorMessage = "";
    successMessage = "";

    await goto(`/teacher/questions?bank=${encodeURIComponent(bankId)}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });
  }

  function openNewQuestion() {
    if (!selectedBankId) {
      errorMessage = "Pilih bank soal terlebih dahulu.";

      return;
    }

    void goto(`/teacher/questions/new?subjectId=${selectedBankId}`);
  }

  function openEditQuestion(questionId: string) {
    void goto(`/teacher/questions/${questionId}/edit?bank=${selectedBankId}`);
  }

  async function createBank(name: string) {
    creatingBank = true;

    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<CreateSubjectResponse>(
        "/teacher/subjects",
        {
          method: "POST",
          body: JSON.stringify({
            name,
          }),
        },
      );

      invalidateTeacherQuestionBanksCache();
      invalidateTeacherSubjectsCache();

      await loadData({
        force: true,
      });

      selectedBankId = result.subject.id;

      successMessage = "Bank soal berhasil dibuat.";

      return true;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal membuat bank soal.";

      return false;
    } finally {
      creatingBank = false;
    }
  }

  async function deleteBank() {
    if (!selectedBank) {
      return;
    }

    const confirmed = confirm(
      `Hapus bank soal "${selectedBank.name}"?\n\nBank hanya dapat dihapus jika tidak memiliki soal dan tidak sedang digunakan oleh tryout.`,
    );

    if (!confirmed) {
      return;
    }

    deletingBankId = selectedBank.id;

    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<DeleteSubjectResponse>(
        `/teacher/subjects/${selectedBank.id}`,
        {
          method: "DELETE",
        },
      );

      selectedBankId = "";

      invalidateTeacherQuestionBanksCache();
      invalidateTeacherSubjectsCache();

      await loadData({
        force: true,
      });

      successMessage = result.message || "Bank soal berhasil dihapus.";
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus bank soal.";
    } finally {
      deletingBankId = "";
    }
  }

  async function deleteQuestion(questionId: string) {
    const confirmed = confirm("Hapus soal ini?");

    if (!confirmed) {
      return;
    }

    deletingQuestionId = questionId;

    errorMessage = "";
    successMessage = "";

    try {
      await apiFetch(`/teacher/questions/${questionId}`, {
        method: "DELETE",
      });

      invalidateTeacherQuestionDataCaches(questionId);

      await loadData({
        force: true,
      });

      successMessage = "Soal berhasil dihapus.";
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus soal.";
    } finally {
      deletingQuestionId = "";
    }
  }

  onMount(() => {
    void loadData();
  });
</script>

<QuestionBankManagement
  {banks}
  questions={selectedQuestions}
  {selectedBankId}
  {loading}
  {refreshing}
  {creatingBank}
  {deletingBankId}
  {deletingQuestionId}
  {errorMessage}
  {successMessage}
  canDeleteBank
  onRefresh={refreshData}
  onSelectBank={selectBank}
  onCreateBank={createBank}
  onDeleteBank={deleteBank}
  onCreateQuestion={openNewQuestion}
  onEditQuestion={openEditQuestion}
  onDeleteQuestion={deleteQuestion}
/>
