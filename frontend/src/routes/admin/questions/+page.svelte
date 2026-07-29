<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";

  import { apiFetch } from "$lib/api";

  import QuestionBankManagement from "$lib/components/questions/QuestionBankManagement.svelte";

  import {
    getAdminQuestionBanksCached,
    getAdminQuestionsCached,
    invalidateAdminQuestionBanksCache,
    invalidateAdminQuestionDataCaches,
    invalidateAdminQuestionsCache,
    readAdminQuestionBanksCache,
    readAdminQuestionsCache,
  } from "$lib/cache/admin-page-cache";

  import type { Question, QuestionBank } from "$lib/types/questions";

  type CreateSubjectResponse = {
    ok: boolean;

    subject: {
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    };
  };

  let loading = $state(true);
  let refreshing = $state(false);
  let creatingBank = $state(false);

  let deletingQuestionId = $state("");

  let errorMessage = $state("");
  let successMessage = $state("");

  let banks = $state<QuestionBank[]>([]);
  let questions = $state<Question[]>([]);

  let selectedBankId = $state("");

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

  async function loadBanks(
    options: {
      force?: boolean;
    } = {},
  ) {
    const force = options.force ?? false;

    const cachedBanks = !force ? readAdminQuestionBanksCache() : null;

    if (cachedBanks) {
      banks = cachedBanks;

      resolveSelectedBank();

      return;
    }

    banks = await getAdminQuestionBanksCached({
      force,
    });

    resolveSelectedBank();
  }

  async function loadQuestions(
    bankId: string,
    options: {
      force?: boolean;
    } = {},
  ) {
    if (!bankId) {
      questions = [];

      return;
    }

    const force = options.force ?? false;

    const params = {
      subjectId: bankId,
    };

    const cachedQuestions = !force ? readAdminQuestionsCache(params) : null;

    if (cachedQuestions) {
      questions = cachedQuestions;

      return;
    }

    questions = await getAdminQuestionsCached(params, {
      force,
    });
  }

  async function loadData(
    options: {
      force?: boolean;
    } = {},
  ) {
    const force = options.force ?? false;

    errorMessage = "";

    loading = banks.length === 0 && questions.length === 0;

    try {
      await loadBanks({
        force,
      });

      await loadQuestions(selectedBankId, {
        force,
      });
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

    invalidateAdminQuestionBanksCache();

    if (selectedBankId) {
      invalidateAdminQuestionsCache(selectedBankId);
    }

    try {
      await loadData({
        force: true,
      });
    } finally {
      refreshing = false;
    }
  }

  async function selectBank(bankId: string) {
    if (bankId === selectedBankId) {
      return;
    }

    selectedBankId = bankId;

    questions = [];

    errorMessage = "";
    successMessage = "";

    await goto(`/admin/questions?bank=${encodeURIComponent(bankId)}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });

    try {
      await loadQuestions(bankId);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal memuat soal.";
    }
  }

  function openNewQuestion() {
    if (!selectedBankId) {
      errorMessage = "Pilih bank soal terlebih dahulu.";

      return;
    }

    void goto(`/admin/questions/new?subjectId=${selectedBankId}`);
  }

  function openEditQuestion(questionId: string) {
    void goto(`/admin/questions/${questionId}/edit?bank=${selectedBankId}`);
  }

  async function createBank(name: string) {
    creatingBank = true;

    errorMessage = "";
    successMessage = "";

    try {
      const result = await apiFetch<CreateSubjectResponse>("/admin/subjects", {
        method: "POST",
        body: JSON.stringify({
          name,
        }),
      });

      invalidateAdminQuestionBanksCache();

      await loadBanks({
        force: true,
      });

      selectedBankId = result.subject.id;

      questions = [];

      await goto(
        `/admin/questions?bank=${encodeURIComponent(result.subject.id)}`,
        {
          replaceState: true,
          noScroll: true,
          keepFocus: true,
        },
      );

      successMessage = "Bank soal berhasil ditambahkan.";

      return true;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Gagal menambahkan bank soal.";

      return false;
    } finally {
      creatingBank = false;
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!selectedBankId) {
      return;
    }

    const confirmed = confirm("Hapus soal ini?");

    if (!confirmed) {
      return;
    }

    deletingQuestionId = questionId;

    errorMessage = "";
    successMessage = "";

    try {
      await apiFetch(`/admin/questions/${questionId}`, {
        method: "DELETE",
      });

      invalidateAdminQuestionDataCaches(selectedBankId);

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
  {questions}
  {selectedBankId}
  {loading}
  {refreshing}
  {creatingBank}
  {deletingQuestionId}
  {errorMessage}
  {successMessage}
  onRefresh={refreshData}
  onSelectBank={selectBank}
  onCreateBank={createBank}
  onCreateQuestion={openNewQuestion}
  onEditQuestion={openEditQuestion}
  onDeleteQuestion={deleteQuestion}
/>
