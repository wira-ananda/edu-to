import type { Context } from "hono";
import {
  isQuestionImageFile,
  type QuestionImageFile,
} from "../lib/question-image-storage.js";
import teacherService, {
  TeacherServiceError,
} from "../service/teacher.service.js";
import {
  difficultyLevels,
  teacherAnalyzeQuestionSchema,
  teacherEnrollmentParamSchema,
  teacherEnrollStudentSchema,
  teacherQuestionSchema,
  teacherSubjectSchema,
  teacherTryoutSchema,
  teacherTryoutStatusSchema,
  weightPriorities,
} from "../schema/teacher.schema.js";
import type { AppEnv } from "../types/hono.js";
import type { DifficultyLevel, WeightPriority } from "../types/domain.js";

type TeacherContext = Context<AppEnv>;

type QuestionRequestReader = {
  contentType: string;
  parseBody: () => Promise<unknown>;
  parseJson: () => Promise<unknown>;
};

type NormalizedQuestionBody = {
  subjectId: string;
  questionText: string;
  imageAltText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  weightPriority: string;
  removeImage: boolean;
};

type ParsedQuestionRequest = {
  data: NormalizedQuestionBody;
  imageFile: QuestionImageFile | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getTextField(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (Array.isArray(value)) {
    const textValue = value.find((item) => typeof item === "string");

    return typeof textValue === "string" ? textValue : "";
  }

  return typeof value === "string" ? value : "";
}

function getBooleanField(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const normalizedValue = getTextField(body, key).toLowerCase();

  return (
    normalizedValue === "true" ||
    normalizedValue === "1" ||
    normalizedValue === "yes"
  );
}

function getFileField(
  body: Record<string, unknown>,
  key: string,
): QuestionImageFile | null {
  const value = body[key];

  if (Array.isArray(value)) {
    const fileValue = value.find((item) => isQuestionImageFile(item));

    return isQuestionImageFile(fileValue) ? fileValue : null;
  }

  return isQuestionImageFile(value) ? value : null;
}

function normalizeQuestionRequestBody(
  body: Record<string, unknown>,
): NormalizedQuestionBody {
  return {
    subjectId: getTextField(body, "subjectId"),
    questionText: getTextField(body, "questionText"),
    imageAltText: getTextField(body, "imageAltText"),
    optionA: getTextField(body, "optionA"),
    optionB: getTextField(body, "optionB"),
    optionC: getTextField(body, "optionC"),
    optionD: getTextField(body, "optionD"),
    correctAnswer: getTextField(body, "correctAnswer"),
    weightPriority: getTextField(body, "weightPriority") || "NORMAL",
    removeImage: getBooleanField(body, "removeImage"),
  };
}

async function parseQuestionRequest(
  reader: QuestionRequestReader,
): Promise<ParsedQuestionRequest> {
  if (reader.contentType.includes("multipart/form-data")) {
    const parsedBody = await reader.parseBody();
    const body = isRecord(parsedBody) ? parsedBody : {};

    return {
      data: normalizeQuestionRequestBody(body),
      imageFile: getFileField(body, "image"),
    };
  }

  const parsedJson = await reader.parseJson().catch(() => null);
  const body = isRecord(parsedJson) ? parsedJson : {};

  return {
    data: normalizeQuestionRequestBody(body),
    imageFile: null,
  };
}

function getRequiredParam(c: TeacherContext, key: string) {
  const value = c.req.param(key);

  if (!value) {
    throw new TeacherServiceError(`${key} wajib dikirim`, 400);
  }

  return value;
}

function getErrorStatus(error: unknown) {
  if (error instanceof TeacherServiceError) {
    return error.statusCode;
  }

  return 500;
}

function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan.") {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function getValidationMessage(parsedError: {
  issues: {
    message: string;
  }[];
}) {
  return parsedError.issues[0]?.message ?? "Data tidak valid";
}

function handleError(c: TeacherContext, error: unknown, fallback?: string) {
  return c.json(
    {
      ok: false,
      message: getErrorMessage(error, fallback),
    },
    getErrorStatus(error) as 400 | 401 | 403 | 404 | 409 | 500,
  );
}

async function check(c: TeacherContext) {
  const user = c.get("user");

  return c.json({
    ok: true,
    message: "Teacher authorized",
    user,
  });
}

async function getSubjects(c: TeacherContext) {
  try {
    const user = c.get("user");

    const result = await teacherService.getSubjects(user.id);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat bank soal.");
  }
}

async function createSubject(c: TeacherContext) {
  try {
    const user = c.get("user");
    const body = await c.req.json().catch(() => null);

    const parsed = teacherSubjectSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await teacherService.createSubject(user.id, parsed.data);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal membuat bank soal.");
  }
}

async function analyzeQuestion(c: TeacherContext) {
  try {
    const body = await c.req.json().catch(() => null);

    const parsed = teacherAnalyzeQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = teacherService.analyzeQuestion(parsed.data);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal menganalisis soal.");
  }
}

async function getQuestions(c: TeacherContext) {
  try {
    const user = c.get("user");

    const search = c.req.query("search")?.trim() ?? "";
    const subjectId = c.req.query("subjectId") ?? "";

    const difficultyLevelQuery = c.req.query("difficultyLevel") as
      | DifficultyLevel
      | undefined;

    const weightPriorityQuery = c.req.query("weightPriority") as
      | WeightPriority
      | undefined;

    const difficultyLevel =
      difficultyLevelQuery && difficultyLevels.includes(difficultyLevelQuery)
        ? difficultyLevelQuery
        : undefined;

    const weightPriority =
      weightPriorityQuery && weightPriorities.includes(weightPriorityQuery)
        ? weightPriorityQuery
        : undefined;

    const result = await teacherService.getQuestions(user.id, {
      search,
      subjectId,
      difficultyLevel,
      weightPriority,
    });

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat soal.");
  }
}

async function getQuestionById(c: TeacherContext) {
  try {
    const user = c.get("user");
    const id = getRequiredParam(c, "id");

    const result = await teacherService.getQuestionById(user.id, id);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat soal.");
  }
}

async function createQuestion(c: TeacherContext) {
  try {
    const user = c.get("user");

    const request = await parseQuestionRequest({
      contentType: c.req.header("content-type") ?? "",
      parseBody: async () => c.req.parseBody(),
      parseJson: async () => c.req.json(),
    });

    const parsed = teacherQuestionSchema.safeParse(request.data);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await teacherService.createQuestion(
      user.id,
      parsed.data,
      request.imageFile,
    );

    return c.json(
      {
        ok: true,
        message: "Soal berhasil ditambahkan",
        ...result,
      },
      201,
    );
  } catch (error) {
    return handleError(c, error, "Gagal menambahkan soal.");
  }
}

async function updateQuestion(c: TeacherContext) {
  try {
    const user = c.get("user");
    const id = getRequiredParam(c, "id");

    const request = await parseQuestionRequest({
      contentType: c.req.header("content-type") ?? "",
      parseBody: async () => c.req.parseBody(),
      parseJson: async () => c.req.json(),
    });

    const parsed = teacherQuestionSchema.safeParse(request.data);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await teacherService.updateQuestion(
      user.id,
      id,
      parsed.data,
      request.imageFile,
    );

    return c.json({
      ok: true,
      message: "Soal berhasil diperbarui",
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memperbarui soal.");
  }
}

async function deleteQuestion(c: TeacherContext) {
  try {
    const user = c.get("user");
    const id = getRequiredParam(c, "id");

    await teacherService.deleteQuestion(user.id, id);

    return c.json({
      ok: true,
      message: "Soal berhasil dihapus",
    });
  } catch (error) {
    return handleError(c, error, "Gagal menghapus soal.");
  }
}

async function getQuestionBanks(c: TeacherContext) {
  try {
    const user = c.get("user");

    const result = await teacherService.getQuestionBanks(user.id);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat bank soal.");
  }
}

async function getTryouts(c: TeacherContext) {
  try {
    const user = c.get("user");

    const result = await teacherService.getTryouts(user.id);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat tryout.");
  }
}

async function getTryoutById(c: TeacherContext) {
  try {
    const user = c.get("user");
    const id = getRequiredParam(c, "id");

    const result = await teacherService.getTryoutById(user.id, id);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat tryout.");
  }
}

async function createTryout(c: TeacherContext) {
  try {
    const user = c.get("user");
    const body = await c.req.json().catch(() => null);

    const parsed = teacherTryoutSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await teacherService.createTryout(user.id, parsed.data);

    return c.json(
      {
        ok: true,
        message: "Tryout berhasil dibuat",
        ...result,
      },
      201,
    );
  } catch (error) {
    return handleError(c, error, "Gagal membuat tryout.");
  }
}

async function updateTryout(c: TeacherContext) {
  try {
    const user = c.get("user");
    const id = getRequiredParam(c, "id");

    const body = await c.req.json().catch(() => null);

    const parsed = teacherTryoutSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await teacherService.updateTryout(user.id, id, parsed.data);

    return c.json({
      ok: true,
      message: "Tryout berhasil diperbarui",
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memperbarui tryout.");
  }
}

async function updateTryoutStatus(c: TeacherContext) {
  try {
    const user = c.get("user");
    const id = getRequiredParam(c, "id");

    const body = await c.req.json().catch(() => null);

    const parsed = teacherTryoutStatusSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: "Status tryout tidak valid",
        },
        400,
      );
    }

    const result = await teacherService.updateTryoutStatus(
      user.id,
      id,
      parsed.data,
    );

    return c.json({
      ok: true,
      message: "Status tryout berhasil diperbarui",
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memperbarui status tryout.");
  }
}

async function deleteTryout(c: TeacherContext) {
  try {
    const user = c.get("user");
    const id = getRequiredParam(c, "id");

    await teacherService.deleteTryout(user.id, id);

    return c.json({
      ok: true,
      message: "Tryout berhasil dihapus",
    });
  } catch (error) {
    return handleError(c, error, "Gagal menghapus tryout.");
  }
}

async function getTryoutParticipants(c: TeacherContext) {
  try {
    const user = c.get("user");
    const id = getRequiredParam(c, "id");

    const result = await teacherService.getTryoutParticipants(user.id, id);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat daftar peserta tryout.");
  }
}

async function enrollStudent(c: TeacherContext) {
  try {
    const user = c.get("user");
    const id = getRequiredParam(c, "id");
    const studentId = getRequiredParam(c, "studentId");

    const parsed = teacherEnrollStudentSchema.safeParse({
      tryoutId: id,
      studentId,
    });

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await teacherService.enrollStudent(
      user.id,
      parsed.data.tryoutId,
      parsed.data.studentId,
    );

    return c.json(
      {
        ok: true,
        message: result.message,
        enrollment: result.enrollment,
      },
      result.created ? 201 : 200,
    );
  } catch (error) {
    return handleError(c, error, "Gagal memasukkan siswa ke tryout.");
  }
}

async function approveEnrollment(c: TeacherContext) {
  try {
    const user = c.get("user");
    const id = getRequiredParam(c, "id");

    const parsed = teacherEnrollmentParamSchema.safeParse({
      enrollmentId: id,
    });

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await teacherService.approveEnrollment(
      user.id,
      parsed.data.enrollmentId,
    );

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal menyetujui peserta.");
  }
}

async function rejectEnrollment(c: TeacherContext) {
  try {
    const user = c.get("user");
    const id = getRequiredParam(c, "id");

    const parsed = teacherEnrollmentParamSchema.safeParse({
      enrollmentId: id,
    });

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await teacherService.rejectEnrollment(
      user.id,
      parsed.data.enrollmentId,
    );

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal menolak peserta.");
  }
}

async function getTryoutResults(c: TeacherContext) {
  try {
    const user = c.get("user");
    const id = getRequiredParam(c, "id");

    const result = await teacherService.getTryoutResults(user.id, id);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat hasil tryout.");
  }
}

async function getTryoutStatistics(c: TeacherContext) {
  try {
    const user = c.get("user");
    const id = getRequiredParam(c, "id");

    const result = await teacherService.getTryoutStatistics(user.id, id);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat statistik tryout.");
  }
}

export default {
  check,

  getSubjects,
  createSubject,

  analyzeQuestion,
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionBanks,

  getTryouts,
  getTryoutById,
  createTryout,
  updateTryout,
  updateTryoutStatus,
  deleteTryout,

  getTryoutParticipants,
  enrollStudent,
  approveEnrollment,
  rejectEnrollment,

  getTryoutResults,
  getTryoutStatistics,
};
