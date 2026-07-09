import { apiFetch } from "$lib/api";
import type {
  StudentResultResponse,
  StudentSessionsResponse,
  StudentTryoutsResponse,
} from "$lib/types/student";

const cacheTtlMs = 5 * 60 * 1000;

type CacheEntry<T> = {
  data: T | null;
  fetchedAt: number;
  inflight: Promise<T> | null;
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

const sessionsCache = createCacheEntry<StudentSessionsResponse["sessions"]>();

const tryoutsCache = createCacheEntry<StudentTryoutsResponse["tryouts"]>();

const resultCaches = new Map<string, CacheEntry<StudentResultResponse>>();

function getResultCacheEntry(sessionId: string) {
  const existingEntry = resultCaches.get(sessionId);

  if (existingEntry) {
    return existingEntry;
  }

  const entry = createCacheEntry<StudentResultResponse>();

  resultCaches.set(sessionId, entry);

  return entry;
}

export function readStudentSessionsCache() {
  if (!isCacheFresh(sessionsCache)) return null;

  return sessionsCache.data as StudentSessionsResponse["sessions"];
}

export async function getStudentSessionsCached(
  options: { force?: boolean } = {},
) {
  const force = options.force ?? false;

  if (!force && isCacheFresh(sessionsCache)) {
    return sessionsCache.data as StudentSessionsResponse["sessions"];
  }

  if (!force && sessionsCache.inflight) {
    return sessionsCache.inflight;
  }

  sessionsCache.inflight = apiFetch<StudentSessionsResponse>(
    "/student/sessions",
  )
    .then((response) => {
      sessionsCache.data = response.sessions;
      sessionsCache.fetchedAt = Date.now();

      return response.sessions;
    })
    .finally(() => {
      sessionsCache.inflight = null;
    });

  return sessionsCache.inflight;
}

export function invalidateStudentSessionsCache() {
  sessionsCache.fetchedAt = 0;
}

export function readStudentTryoutsCache() {
  if (!isCacheFresh(tryoutsCache)) return null;

  return tryoutsCache.data as StudentTryoutsResponse["tryouts"];
}

export async function getStudentTryoutsCached(
  options: { force?: boolean } = {},
) {
  const force = options.force ?? false;

  if (!force && isCacheFresh(tryoutsCache)) {
    return tryoutsCache.data as StudentTryoutsResponse["tryouts"];
  }

  if (!force && tryoutsCache.inflight) {
    return tryoutsCache.inflight;
  }

  tryoutsCache.inflight = apiFetch<StudentTryoutsResponse>("/student/tryouts")
    .then((response) => {
      tryoutsCache.data = response.tryouts;
      tryoutsCache.fetchedAt = Date.now();

      return response.tryouts;
    })
    .finally(() => {
      tryoutsCache.inflight = null;
    });

  return tryoutsCache.inflight;
}

export function invalidateStudentTryoutsCache() {
  tryoutsCache.fetchedAt = 0;
}

export function readStudentResultCache(sessionId: string) {
  const entry = resultCaches.get(sessionId);

  if (!entry || !isCacheFresh(entry)) return null;

  return entry.data as StudentResultResponse;
}

export async function getStudentResultCached(
  sessionId: string,
  options: { force?: boolean } = {},
) {
  const force = options.force ?? false;
  const entry = getResultCacheEntry(sessionId);

  if (!force && isCacheFresh(entry)) {
    return entry.data as StudentResultResponse;
  }

  if (!force && entry.inflight) {
    return entry.inflight;
  }

  entry.inflight = apiFetch<StudentResultResponse>(
    `/student/sessions/${sessionId}/result`,
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

export function invalidateStudentResultCache(sessionId?: string) {
  if (!sessionId) {
    resultCaches.clear();
    return;
  }

  const entry = resultCaches.get(sessionId);

  if (entry) {
    entry.fetchedAt = 0;
  }
}

export function clearStudentPageCache() {
  sessionsCache.data = null;
  sessionsCache.fetchedAt = 0;
  sessionsCache.inflight = null;

  tryoutsCache.data = null;
  tryoutsCache.fetchedAt = 0;
  tryoutsCache.inflight = null;

  resultCaches.clear();
}
