import { apiFetch } from "$lib/api";
import type { AdminTryoutItem, AdminTryoutsResponse } from "$lib/types/admin";
import type {
  Question,
  QuestionBank,
  QuestionBanksResponse,
  QuestionsResponse,
} from "$lib/types/questions";
import type { TeacherAccount, TeacherAccountsResponse } from "$lib/types/users";

const cacheTtlMs = 5 * 60 * 1000;

type CacheEntry<T> = {
  data: T | null;
  fetchedAt: number;
  inflight: Promise<T> | null;
};

type AdminQuestionsParams = {
  subjectId: string;
  search?: string;
  difficultyLevel?: string;
  weightPriority?: string;
};

function createCacheEntry<T>(): CacheEntry<T> {
  return {
    data: null,
    fetchedAt: 0,
    inflight: null,
  };
}

function isCacheFresh<T>(entry: CacheEntry<T>) {
  return entry.data !== null && Date.now() - entry.fetchedAt < cacheTtlMs;
}

const teacherAccountsCache = createCacheEntry<TeacherAccount[]>();

const adminTryoutsCache = createCacheEntry<AdminTryoutItem[]>();

const questionBanksCache = createCacheEntry<QuestionBank[]>();

const questionsCache = new Map<string, CacheEntry<Question[]>>();

function normalizeText(value?: string) {
  return value?.trim() ?? "";
}

function getQuestionsCacheKey(params: AdminQuestionsParams) {
  return [
    params.subjectId,
    normalizeText(params.search),
    normalizeText(params.difficultyLevel),
    normalizeText(params.weightPriority),
  ].join("::");
}

function getQuestionsCacheEntry(params: AdminQuestionsParams) {
  const key = getQuestionsCacheKey(params);
  const existingEntry = questionsCache.get(key);

  if (existingEntry) {
    return existingEntry;
  }

  const entry = createCacheEntry<Question[]>();

  questionsCache.set(key, entry);

  return entry;
}

function buildQuestionsUrl(params: AdminQuestionsParams) {
  const searchParams = new URLSearchParams();

  searchParams.set("subjectId", params.subjectId);

  const search = normalizeText(params.search);
  const difficultyLevel = normalizeText(params.difficultyLevel);
  const weightPriority = normalizeText(params.weightPriority);

  if (search) searchParams.set("search", search);
  if (difficultyLevel) searchParams.set("difficultyLevel", difficultyLevel);
  if (weightPriority) searchParams.set("weightPriority", weightPriority);

  return `/admin/questions?${searchParams.toString()}`;
}

export function readAdminTeacherAccountsCache() {
  if (!isCacheFresh(teacherAccountsCache)) return null;

  return teacherAccountsCache.data as TeacherAccount[];
}

export async function getAdminTeacherAccountsCached(
  options: { force?: boolean } = {},
) {
  const force = options.force ?? false;

  if (!force && isCacheFresh(teacherAccountsCache)) {
    return teacherAccountsCache.data as TeacherAccount[];
  }

  if (!force && teacherAccountsCache.inflight) {
    return teacherAccountsCache.inflight;
  }

  teacherAccountsCache.inflight = apiFetch<TeacherAccountsResponse>(
    "/admin/users/teachers",
  )
    .then((response) => {
      teacherAccountsCache.data = response.teachers;
      teacherAccountsCache.fetchedAt = Date.now();

      return response.teachers;
    })
    .finally(() => {
      teacherAccountsCache.inflight = null;
    });

  return teacherAccountsCache.inflight;
}

export function invalidateAdminTeacherAccountsCache() {
  teacherAccountsCache.fetchedAt = 0;
}

export function readAdminTryoutsCache() {
  if (!isCacheFresh(adminTryoutsCache)) return null;

  return adminTryoutsCache.data as AdminTryoutItem[];
}

export async function getAdminTryoutsCached(options: { force?: boolean } = {}) {
  const force = options.force ?? false;

  if (!force && isCacheFresh(adminTryoutsCache)) {
    return adminTryoutsCache.data as AdminTryoutItem[];
  }

  if (!force && adminTryoutsCache.inflight) {
    return adminTryoutsCache.inflight;
  }

  adminTryoutsCache.inflight = apiFetch<AdminTryoutsResponse>("/admin/tryouts")
    .then((response) => {
      adminTryoutsCache.data = response.tryouts;
      adminTryoutsCache.fetchedAt = Date.now();

      return response.tryouts;
    })
    .finally(() => {
      adminTryoutsCache.inflight = null;
    });

  return adminTryoutsCache.inflight;
}

export function invalidateAdminTryoutsCache() {
  adminTryoutsCache.fetchedAt = 0;
}

export function readAdminQuestionBanksCache() {
  if (!isCacheFresh(questionBanksCache)) return null;

  return questionBanksCache.data as QuestionBank[];
}

export async function getAdminQuestionBanksCached(
  options: { force?: boolean } = {},
) {
  const force = options.force ?? false;

  if (!force && isCacheFresh(questionBanksCache)) {
    return questionBanksCache.data as QuestionBank[];
  }

  if (!force && questionBanksCache.inflight) {
    return questionBanksCache.inflight;
  }

  questionBanksCache.inflight = apiFetch<QuestionBanksResponse>(
    "/admin/question-banks",
  )
    .then((response) => {
      questionBanksCache.data = response.banks;
      questionBanksCache.fetchedAt = Date.now();

      return response.banks;
    })
    .finally(() => {
      questionBanksCache.inflight = null;
    });

  return questionBanksCache.inflight;
}

export function invalidateAdminQuestionBanksCache() {
  questionBanksCache.fetchedAt = 0;
}

export function readAdminQuestionsCache(params: AdminQuestionsParams) {
  const entry = questionsCache.get(getQuestionsCacheKey(params));

  if (!entry || !isCacheFresh(entry)) return null;

  return entry.data as Question[];
}

export async function getAdminQuestionsCached(
  params: AdminQuestionsParams,
  options: { force?: boolean } = {},
) {
  const force = options.force ?? false;
  const entry = getQuestionsCacheEntry(params);

  if (!force && isCacheFresh(entry)) {
    return entry.data as Question[];
  }

  if (!force && entry.inflight) {
    return entry.inflight;
  }

  entry.inflight = apiFetch<QuestionsResponse>(buildQuestionsUrl(params))
    .then((response) => {
      entry.data = response.questions;
      entry.fetchedAt = Date.now();

      return response.questions;
    })
    .finally(() => {
      entry.inflight = null;
    });

  return entry.inflight;
}

export function invalidateAdminQuestionsCache(subjectId?: string) {
  if (!subjectId) {
    questionsCache.clear();
    return;
  }

  for (const key of questionsCache.keys()) {
    if (key.startsWith(`${subjectId}::`)) {
      questionsCache.delete(key);
    }
  }
}

export function clearAdminPageCache() {
  teacherAccountsCache.data = null;
  teacherAccountsCache.fetchedAt = 0;
  teacherAccountsCache.inflight = null;

  adminTryoutsCache.data = null;
  adminTryoutsCache.fetchedAt = 0;
  adminTryoutsCache.inflight = null;

  questionBanksCache.data = null;
  questionBanksCache.fetchedAt = 0;
  questionBanksCache.inflight = null;

  questionsCache.clear();
}
