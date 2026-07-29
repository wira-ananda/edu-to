import { apiFetch } from "$lib/api";

import type {
  AdminTryoutItem,
  AdminTryoutsResponse,
  TryoutParticipantsResponse,
  TryoutResultsResponse,
  TryoutStatisticsResponse,
} from "$lib/types/admin";

import type {
  Question,
  QuestionBank,
  QuestionBanksResponse,
  QuestionsResponse,
} from "$lib/types/questions";

import type { TeacherAccount, TeacherAccountsResponse } from "$lib/types/users";

// ============================================================
// CONFIG
// ============================================================

const cacheTtlMs = 5 * 60 * 1000;

// ============================================================
// TYPES
// ============================================================

type CacheEntry<T> = {
  data: T | null;
  fetchedAt: number;
  inflight: Promise<T> | null;
};

type CacheOptions = {
  force?: boolean;
};

type AdminQuestionsParams = {
  subjectId: string;
  search?: string;
  difficultyLevel?: string;
  weightPriority?: string;
};

// ============================================================
// CACHE HELPERS
// ============================================================

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

function normalizeText(value?: string) {
  return value?.trim() ?? "";
}

// ============================================================
// CACHE STORAGE
// ============================================================

const teacherAccountsCache = createCacheEntry<TeacherAccount[]>();

const adminTryoutsCache = createCacheEntry<AdminTryoutItem[]>();

const questionBanksCache = createCacheEntry<QuestionBank[]>();

const questionsCache = new Map<string, CacheEntry<Question[]>>();

const adminTryoutParticipantsCache = new Map<
  string,
  CacheEntry<TryoutParticipantsResponse>
>();

const adminTryoutResultsCache = new Map<
  string,
  CacheEntry<TryoutResultsResponse>
>();

const adminTryoutStatisticsCache = new Map<
  string,
  CacheEntry<TryoutStatisticsResponse>
>();

// ============================================================
// QUESTION CACHE HELPERS
// ============================================================

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

  if (search) {
    searchParams.set("search", search);
  }

  if (difficultyLevel) {
    searchParams.set("difficultyLevel", difficultyLevel);
  }

  if (weightPriority) {
    searchParams.set("weightPriority", weightPriority);
  }

  return `/admin/questions?${searchParams.toString()}`;
}

// ============================================================
// TRYOUT KEYED CACHE HELPERS
// ============================================================

function getAdminTryoutParticipantsCacheEntry(tryoutId: string) {
  const existingEntry = adminTryoutParticipantsCache.get(tryoutId);

  if (existingEntry) {
    return existingEntry;
  }

  const entry = createCacheEntry<TryoutParticipantsResponse>();

  adminTryoutParticipantsCache.set(tryoutId, entry);

  return entry;
}

function getAdminTryoutResultsCacheEntry(tryoutId: string) {
  const existingEntry = adminTryoutResultsCache.get(tryoutId);

  if (existingEntry) {
    return existingEntry;
  }

  const entry = createCacheEntry<TryoutResultsResponse>();

  adminTryoutResultsCache.set(tryoutId, entry);

  return entry;
}

function getAdminTryoutStatisticsCacheEntry(tryoutId: string) {
  const existingEntry = adminTryoutStatisticsCache.get(tryoutId);

  if (existingEntry) {
    return existingEntry;
  }

  const entry = createCacheEntry<TryoutStatisticsResponse>();

  adminTryoutStatisticsCache.set(tryoutId, entry);

  return entry;
}

// ============================================================
// TEACHER ACCOUNTS
// ============================================================

export function readAdminTeacherAccountsCache() {
  if (!isCacheFresh(teacherAccountsCache)) {
    return null;
  }

  return teacherAccountsCache.data as TeacherAccount[];
}

export async function getAdminTeacherAccountsCached(
  options: CacheOptions = {},
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

// ============================================================
// ADMIN TRYOUT LIST
// ============================================================

export function readAdminTryoutsCache() {
  if (!isCacheFresh(adminTryoutsCache)) {
    return null;
  }

  return adminTryoutsCache.data as AdminTryoutItem[];
}

export async function getAdminTryoutsCached(options: CacheOptions = {}) {
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

// ============================================================
// QUESTION BANKS
// ============================================================

export function readAdminQuestionBanksCache() {
  if (!isCacheFresh(questionBanksCache)) {
    return null;
  }

  return questionBanksCache.data as QuestionBank[];
}

export async function getAdminQuestionBanksCached(options: CacheOptions = {}) {
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

// ============================================================
// QUESTIONS
// ============================================================

export function readAdminQuestionsCache(params: AdminQuestionsParams) {
  const entry = questionsCache.get(getQuestionsCacheKey(params));

  if (!entry || !isCacheFresh(entry)) {
    return null;
  }

  return entry.data as Question[];
}

export async function getAdminQuestionsCached(
  params: AdminQuestionsParams,
  options: CacheOptions = {},
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

// ============================================================
// TRYOUT PARTICIPANTS
// ============================================================

export function readAdminTryoutParticipantsCache(tryoutId: string) {
  const entry = adminTryoutParticipantsCache.get(tryoutId);

  if (!entry || !isCacheFresh(entry)) {
    return null;
  }

  return entry.data as TryoutParticipantsResponse;
}

export async function getAdminTryoutParticipantsCached(
  tryoutId: string,
  options: CacheOptions = {},
) {
  const force = options.force ?? false;

  const entry = getAdminTryoutParticipantsCacheEntry(tryoutId);

  if (!force && isCacheFresh(entry)) {
    return entry.data as TryoutParticipantsResponse;
  }

  if (!force && entry.inflight) {
    return entry.inflight;
  }

  entry.inflight = apiFetch<TryoutParticipantsResponse>(
    `/admin/tryouts/${tryoutId}/participants`,
  )
    .then((response) => {
      entry.data = response;

      entry.fetchedAt = Date.now();

      return response;
    })
    .finally(() => {
      entry.inflight = null;
    });

  return entry.inflight;
}

export function invalidateAdminTryoutParticipantsCache(tryoutId?: string) {
  if (!tryoutId) {
    adminTryoutParticipantsCache.clear();

    return;
  }

  adminTryoutParticipantsCache.delete(tryoutId);
}

// ============================================================
// TRYOUT RESULTS
// ============================================================

export function readAdminTryoutResultsCache(tryoutId: string) {
  const entry = adminTryoutResultsCache.get(tryoutId);

  if (!entry || !isCacheFresh(entry)) {
    return null;
  }

  return entry.data as TryoutResultsResponse;
}

export async function getAdminTryoutResultsCached(
  tryoutId: string,
  options: CacheOptions = {},
) {
  const force = options.force ?? false;

  const entry = getAdminTryoutResultsCacheEntry(tryoutId);

  if (!force && isCacheFresh(entry)) {
    return entry.data as TryoutResultsResponse;
  }

  if (!force && entry.inflight) {
    return entry.inflight;
  }

  entry.inflight = apiFetch<TryoutResultsResponse>(
    `/admin/tryouts/${tryoutId}/results`,
  )
    .then((response) => {
      entry.data = response;

      entry.fetchedAt = Date.now();

      return response;
    })
    .finally(() => {
      entry.inflight = null;
    });

  return entry.inflight;
}

export function invalidateAdminTryoutResultsCache(tryoutId?: string) {
  if (!tryoutId) {
    adminTryoutResultsCache.clear();

    return;
  }

  adminTryoutResultsCache.delete(tryoutId);
}

// ============================================================
// TRYOUT STATISTICS
// ============================================================

export function readAdminTryoutStatisticsCache(tryoutId: string) {
  const entry = adminTryoutStatisticsCache.get(tryoutId);

  if (!entry || !isCacheFresh(entry)) {
    return null;
  }

  return entry.data as TryoutStatisticsResponse;
}

export async function getAdminTryoutStatisticsCached(
  tryoutId: string,
  options: CacheOptions = {},
) {
  const force = options.force ?? false;

  const entry = getAdminTryoutStatisticsCacheEntry(tryoutId);

  if (!force && isCacheFresh(entry)) {
    return entry.data as TryoutStatisticsResponse;
  }

  if (!force && entry.inflight) {
    return entry.inflight;
  }

  entry.inflight = apiFetch<TryoutStatisticsResponse>(
    `/admin/tryouts/${tryoutId}/statistics`,
  )
    .then((response) => {
      entry.data = response;

      entry.fetchedAt = Date.now();

      return response;
    })
    .finally(() => {
      entry.inflight = null;
    });

  return entry.inflight;
}

export function invalidateAdminTryoutStatisticsCache(tryoutId?: string) {
  if (!tryoutId) {
    adminTryoutStatisticsCache.clear();

    return;
  }

  adminTryoutStatisticsCache.delete(tryoutId);
}

// ============================================================
// QUESTION RELATED INVALIDATION
// ============================================================

export function invalidateAdminQuestionDataCaches(subjectId?: string) {
  invalidateAdminQuestionBanksCache();

  invalidateAdminQuestionsCache(subjectId);

  /*
   * Jumlah soal di dalam bank ditampilkan
   * juga pada daftar tryout.
   *
   * Jadi ketika soal berubah,
   * tryout cache sebaiknya ikut invalid.
   */
  invalidateAdminTryoutsCache();
}

// ============================================================
// TRYOUT RELATED INVALIDATION
// ============================================================

export function invalidateAdminTryoutRelatedCaches(tryoutId?: string) {
  invalidateAdminTryoutsCache();

  invalidateAdminTryoutParticipantsCache(tryoutId);

  invalidateAdminTryoutResultsCache(tryoutId);

  invalidateAdminTryoutStatisticsCache(tryoutId);
}

// ============================================================
// PARTICIPANT MUTATION INVALIDATION
// ============================================================

export function invalidateAdminParticipantMutationCaches(tryoutId: string) {
  /*
   * Approve / reject / direct enroll bisa mengubah:
   *
   * - jumlah participant pada daftar tryout
   * - daftar participant
   * - hasil
   * - statistik
   */

  invalidateAdminTryoutsCache();

  invalidateAdminTryoutParticipantsCache(tryoutId);

  invalidateAdminTryoutResultsCache(tryoutId);

  invalidateAdminTryoutStatisticsCache(tryoutId);
}

// ============================================================
// CLEAR ALL
// ============================================================

export function clearAdminPageCache() {
  // Teacher accounts
  teacherAccountsCache.data = null;

  teacherAccountsCache.fetchedAt = 0;

  teacherAccountsCache.inflight = null;

  // Tryout list
  adminTryoutsCache.data = null;

  adminTryoutsCache.fetchedAt = 0;

  adminTryoutsCache.inflight = null;

  // Question banks
  questionBanksCache.data = null;

  questionBanksCache.fetchedAt = 0;

  questionBanksCache.inflight = null;

  // Questions
  questionsCache.clear();

  // Tryout keyed caches
  adminTryoutParticipantsCache.clear();

  adminTryoutResultsCache.clear();

  adminTryoutStatisticsCache.clear();
}
