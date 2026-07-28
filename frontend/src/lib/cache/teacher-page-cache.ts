import { apiFetch } from "$lib/api";
import type {
  TeacherQuestionBanksResponse,
  TeacherQuestionResponse,
  TeacherQuestionsResponse,
  TeacherSubjectsResponse,
  TeacherTryoutItem,
  TeacherTryoutParticipantsResponse,
  TeacherTryoutResponse,
  TeacherTryoutResultsResponse,
  TeacherTryoutsResponse,
  TeacherTryoutStatisticsResponse,
} from "$lib/types/teacher";

type CacheOptions = {
  force?: boolean;
};

function cloneData<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function createSingleCache<T>(loader: () => Promise<T>) {
  let cachedValue: T | null = null;
  let activeRequest: Promise<T> | null = null;

  function read() {
    if (cachedValue === null) {
      return null;
    }

    return cloneData(cachedValue);
  }

  function write(value: T) {
    cachedValue = cloneData(value);
  }

  function invalidate() {
    cachedValue = null;
  }

  async function get(options: CacheOptions = {}) {
    const force = options.force ?? false;

    if (!force && cachedValue !== null) {
      return cloneData(cachedValue);
    }

    if (!activeRequest) {
      activeRequest = loader()
        .then((result) => {
          write(result);

          return cloneData(result);
        })
        .finally(() => {
          activeRequest = null;
        });
    }

    return cloneData(await activeRequest);
  }

  return {
    read,
    write,
    invalidate,
    get,
  };
}

function createKeyedCache<T>(loader: (key: string) => Promise<T>) {
  const cachedValues = new Map<string, T>();
  const activeRequests = new Map<string, Promise<T>>();

  function read(key: string) {
    const cachedValue = cachedValues.get(key);

    if (!cachedValue) {
      return null;
    }

    return cloneData(cachedValue);
  }

  function write(key: string, value: T) {
    cachedValues.set(key, cloneData(value));
  }

  function invalidate(key?: string) {
    if (key) {
      cachedValues.delete(key);
      return;
    }

    cachedValues.clear();
  }

  async function get(key: string, options: CacheOptions = {}) {
    const force = options.force ?? false;

    if (!force) {
      const cachedValue = cachedValues.get(key);

      if (cachedValue) {
        return cloneData(cachedValue);
      }
    }

    const existingRequest = activeRequests.get(key);

    if (existingRequest) {
      return cloneData(await existingRequest);
    }

    const request = loader(key)
      .then((result) => {
        write(key, result);

        return cloneData(result);
      })
      .finally(() => {
        activeRequests.delete(key);
      });

    activeRequests.set(key, request);

    return cloneData(await request);
  }

  return {
    read,
    write,
    invalidate,
    get,
  };
}

const teacherQuestionBanksCache = createSingleCache(
  async (): Promise<TeacherQuestionBanksResponse["banks"]> => {
    const result = await apiFetch<TeacherQuestionBanksResponse>(
      "/teacher/question-banks",
    );

    return result.banks;
  },
);

const teacherQuestionsCache = createSingleCache(
  async (): Promise<TeacherQuestionsResponse["questions"]> => {
    const result =
      await apiFetch<TeacherQuestionsResponse>("/teacher/questions");

    return result.questions;
  },
);

const teacherSubjectsCache = createSingleCache(
  async (): Promise<TeacherSubjectsResponse["subjects"]> => {
    const result = await apiFetch<TeacherSubjectsResponse>("/teacher/subjects");

    return result.subjects;
  },
);

const teacherTryoutsCache = createSingleCache(
  async (): Promise<TeacherTryoutItem[]> => {
    const result = await apiFetch<TeacherTryoutsResponse>("/teacher/tryouts");

    return result.tryouts;
  },
);

const teacherQuestionDetailCache = createKeyedCache(
  async (questionId: string): Promise<TeacherQuestionResponse["question"]> => {
    const result = await apiFetch<TeacherQuestionResponse>(
      `/teacher/questions/${questionId}`,
    );

    return result.question;
  },
);

const teacherTryoutDetailCache = createKeyedCache(
  async (tryoutId: string): Promise<TeacherTryoutResponse["tryout"]> => {
    const result = await apiFetch<TeacherTryoutResponse>(
      `/teacher/tryouts/${tryoutId}`,
    );

    return result.tryout;
  },
);

const teacherTryoutParticipantsCache = createKeyedCache(
  async (tryoutId: string): Promise<TeacherTryoutParticipantsResponse> => {
    return apiFetch<TeacherTryoutParticipantsResponse>(
      `/teacher/tryouts/${tryoutId}/participants`,
    );
  },
);

const teacherTryoutResultsCache = createKeyedCache(
  async (tryoutId: string): Promise<TeacherTryoutResultsResponse> => {
    return apiFetch<TeacherTryoutResultsResponse>(
      `/teacher/tryouts/${tryoutId}/results`,
    );
  },
);

const teacherTryoutStatisticsCache = createKeyedCache(
  async (tryoutId: string): Promise<TeacherTryoutStatisticsResponse> => {
    return apiFetch<TeacherTryoutStatisticsResponse>(
      `/teacher/tryouts/${tryoutId}/statistics`,
    );
  },
);

// Question banks

export function readTeacherQuestionBanksCache() {
  return teacherQuestionBanksCache.read();
}

export function writeTeacherQuestionBanksCache(
  banks: TeacherQuestionBanksResponse["banks"],
) {
  teacherQuestionBanksCache.write(banks);
}

export function invalidateTeacherQuestionBanksCache() {
  teacherQuestionBanksCache.invalidate();
}

export function getTeacherQuestionBanksCached(options: CacheOptions = {}) {
  return teacherQuestionBanksCache.get(options);
}

// Questions

export function readTeacherQuestionsCache() {
  return teacherQuestionsCache.read();
}

export function writeTeacherQuestionsCache(
  questions: TeacherQuestionsResponse["questions"],
) {
  teacherQuestionsCache.write(questions);
}

export function invalidateTeacherQuestionsCache() {
  teacherQuestionsCache.invalidate();
}

export function getTeacherQuestionsCached(options: CacheOptions = {}) {
  return teacherQuestionsCache.get(options);
}

// Subjects

export function readTeacherSubjectsCache() {
  return teacherSubjectsCache.read();
}

export function writeTeacherSubjectsCache(
  subjects: TeacherSubjectsResponse["subjects"],
) {
  teacherSubjectsCache.write(subjects);
}

export function invalidateTeacherSubjectsCache() {
  teacherSubjectsCache.invalidate();
}

export function getTeacherSubjectsCached(options: CacheOptions = {}) {
  return teacherSubjectsCache.get(options);
}

// Tryouts

export function readTeacherTryoutsCache() {
  return teacherTryoutsCache.read();
}

export function writeTeacherTryoutsCache(tryouts: TeacherTryoutItem[]) {
  teacherTryoutsCache.write(tryouts);
}

export function invalidateTeacherTryoutsCache() {
  teacherTryoutsCache.invalidate();
}

export function getTeacherTryoutsCached(options: CacheOptions = {}) {
  return teacherTryoutsCache.get(options);
}

// Question detail

export function readTeacherQuestionDetailCache(questionId: string) {
  return teacherQuestionDetailCache.read(questionId);
}

export function writeTeacherQuestionDetailCache(
  questionId: string,
  question: TeacherQuestionResponse["question"],
) {
  teacherQuestionDetailCache.write(questionId, question);
}

export function invalidateTeacherQuestionDetailCache(questionId?: string) {
  teacherQuestionDetailCache.invalidate(questionId);
}

export function getTeacherQuestionDetailCached(
  questionId: string,
  options: CacheOptions = {},
) {
  return teacherQuestionDetailCache.get(questionId, options);
}

// Tryout detail

export function readTeacherTryoutDetailCache(tryoutId: string) {
  return teacherTryoutDetailCache.read(tryoutId);
}

export function writeTeacherTryoutDetailCache(
  tryoutId: string,
  tryout: TeacherTryoutResponse["tryout"],
) {
  teacherTryoutDetailCache.write(tryoutId, tryout);
}

export function invalidateTeacherTryoutDetailCache(tryoutId?: string) {
  teacherTryoutDetailCache.invalidate(tryoutId);
}

export function getTeacherTryoutDetailCached(
  tryoutId: string,
  options: CacheOptions = {},
) {
  return teacherTryoutDetailCache.get(tryoutId, options);
}

// Participants

export function readTeacherTryoutParticipantsCache(tryoutId: string) {
  return teacherTryoutParticipantsCache.read(tryoutId);
}

export function writeTeacherTryoutParticipantsCache(
  tryoutId: string,
  data: TeacherTryoutParticipantsResponse,
) {
  teacherTryoutParticipantsCache.write(tryoutId, data);
}

export function invalidateTeacherTryoutParticipantsCache(tryoutId?: string) {
  teacherTryoutParticipantsCache.invalidate(tryoutId);
}

export function getTeacherTryoutParticipantsCached(
  tryoutId: string,
  options: CacheOptions = {},
) {
  return teacherTryoutParticipantsCache.get(tryoutId, options);
}

// Results

export function readTeacherTryoutResultsCache(tryoutId: string) {
  return teacherTryoutResultsCache.read(tryoutId);
}

export function writeTeacherTryoutResultsCache(
  tryoutId: string,
  data: TeacherTryoutResultsResponse,
) {
  teacherTryoutResultsCache.write(tryoutId, data);
}

export function invalidateTeacherTryoutResultsCache(tryoutId?: string) {
  teacherTryoutResultsCache.invalidate(tryoutId);
}

export function getTeacherTryoutResultsCached(
  tryoutId: string,
  options: CacheOptions = {},
) {
  return teacherTryoutResultsCache.get(tryoutId, options);
}

// Statistics

export function readTeacherTryoutStatisticsCache(tryoutId: string) {
  return teacherTryoutStatisticsCache.read(tryoutId);
}

export function writeTeacherTryoutStatisticsCache(
  tryoutId: string,
  data: TeacherTryoutStatisticsResponse,
) {
  teacherTryoutStatisticsCache.write(tryoutId, data);
}

export function invalidateTeacherTryoutStatisticsCache(tryoutId?: string) {
  teacherTryoutStatisticsCache.invalidate(tryoutId);
}

export function getTeacherTryoutStatisticsCached(
  tryoutId: string,
  options: CacheOptions = {},
) {
  return teacherTryoutStatisticsCache.get(tryoutId, options);
}

// Helper invalidation

export function invalidateTeacherQuestionDataCaches(questionId?: string) {
  invalidateTeacherQuestionsCache();
  invalidateTeacherQuestionBanksCache();
  invalidateTeacherSubjectsCache();
  invalidateTeacherTryoutsCache();

  if (questionId) {
    invalidateTeacherQuestionDetailCache(questionId);
  }
}

export function invalidateTeacherTryoutRelatedCaches(tryoutId?: string) {
  invalidateTeacherTryoutsCache();
  invalidateTeacherTryoutDetailCache(tryoutId);
  invalidateTeacherTryoutParticipantsCache(tryoutId);
  invalidateTeacherTryoutResultsCache(tryoutId);
  invalidateTeacherTryoutStatisticsCache(tryoutId);
}

export function invalidateAllTeacherPageCaches() {
  invalidateTeacherQuestionBanksCache();
  invalidateTeacherQuestionsCache();
  invalidateTeacherSubjectsCache();
  invalidateTeacherTryoutsCache();

  invalidateTeacherQuestionDetailCache();
  invalidateTeacherTryoutDetailCache();
  invalidateTeacherTryoutParticipantsCache();
  invalidateTeacherTryoutResultsCache();
  invalidateTeacherTryoutStatisticsCache();
}
