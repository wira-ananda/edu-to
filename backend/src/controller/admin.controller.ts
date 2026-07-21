import type { Context } from "hono";
import {
  isQuestionImageFile,
  type QuestionImageFile,
} from "../lib/question-image-storage.js";
import adminService, { AdminServiceError } from "../service/admin.service.js";
import {
  adminAnalyzeQuestionSchema,
  adminQuestionSchema,
  adminSubjectSchema,
  adminTryoutSchema,
  adminTryoutStatusSchema,
  difficultyLevels,
  weightPriorities,
} from "../schema/admin.schema.js";
import type { AppEnv } from "../types/hono.js";
import type { DifficultyLevel, WeightPriority } from "../types/domain.js";

type AdminContext = Context<AppEnv>;

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

function getRequiredParam(c: AdminContext, key: string) {
  const value = c.req.param(key);

  if (!value) {
    throw new AdminServiceError(`${key} wajib dikirim`, 400);
  }

  return value;
}

function getErrorStatus(error: unknown) {
  if (error instanceof AdminServiceError) {
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

function handleError(c: AdminContext, error: unknown, fallback?: string) {
  return c.json(
    {
      ok: false,
      message: getErrorMessage(error, fallback),
    },
    getErrorStatus(error) as 400 | 401 | 403 | 404 | 409 | 500,
  );
}

async function check(c: AdminContext) {
  const user = c.get("user");

  return c.json({
    ok: true,
    message: "Admin authorized",
    user,
  });
}

async function getSubjects(c: AdminContext) {
  try {
    const ownerId = c.req.query("ownerId")?.trim();

    const result = await adminService.getSubjects(ownerId);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat bank soal.");
  }
}

async function createSubject(c: AdminContext) {
  try {
    const body = await c.req.json().catch(() => null);

    const parsed = adminSubjectSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await adminService.createSubject(parsed.data);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal membuat bank soal.");
  }
}

async function analyzeQuestion(c: AdminContext) {
  try {
    const body = await c.req.json().catch(() => null);

    const parsed = adminAnalyzeQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = adminService.analyzeQuestion(parsed.data);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal menganalisis soal.");
  }
}

async function getQuestions(c: AdminContext) {
  try {
    const search = c.req.query("search")?.trim() ?? "";
    const subjectId = c.req.query("subjectId") ?? "";
    const ownerId = c.req.query("ownerId")?.trim() ?? "";

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

    const result = await adminService.getQuestions({
      search,
      subjectId,
      ownerId,
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

async function getQuestionBanks(c: AdminContext) {
  try {
    const result = await adminService.getQuestionBanks();

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat bank soal.");
  }
}

async function getQuestionById(c: AdminContext) {
  try {
    const id = getRequiredParam(c, "id");

    const result = await adminService.getQuestionById(id);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat soal.");
  }
}

async function createQuestion(c: AdminContext) {
  try {
    const request = await parseQuestionRequest({
      contentType: c.req.header("content-type") ?? "",
      parseBody: async () => c.req.parseBody(),
      parseJson: async () => c.req.json(),
    });

    const parsed = adminQuestionSchema.safeParse(request.data);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await adminService.createQuestion(
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

async function updateQuestion(c: AdminContext) {
  try {
    const id = getRequiredParam(c, "id");

    const request = await parseQuestionRequest({
      contentType: c.req.header("content-type") ?? "",
      parseBody: async () => c.req.parseBody(),
      parseJson: async () => c.req.json(),
    });

    const parsed = adminQuestionSchema.safeParse(request.data);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await adminService.updateQuestion(
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

async function deleteQuestion(c: AdminContext) {
  try {
    const id = getRequiredParam(c, "id");

    await adminService.deleteQuestion(id);

    return c.json({
      ok: true,
      message: "Soal berhasil dihapus",
    });
  } catch (error) {
    return handleError(c, error, "Gagal menghapus soal.");
  }
}

async function getTryouts(c: AdminContext) {
  try {
    const status = c.req.query("status")?.trim();
    const ownerId = c.req.query("ownerId")?.trim();

    const result = await adminService.getTryouts({
      status,
      ownerId,
    });

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat tryout.");
  }
}

async function getTryoutById(c: AdminContext) {
  try {
    const id = getRequiredParam(c, "id");

    const result = await adminService.getTryoutById(id);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat tryout.");
  }
}

async function createTryout(c: AdminContext) {
  try {
    const body = await c.req.json().catch(() => null);

    const parsed = adminTryoutSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await adminService.createTryout(parsed.data);

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

async function updateTryout(c: AdminContext) {
  try {
    const id = getRequiredParam(c, "id");

    const body = await c.req.json().catch(() => null);

    const parsed = adminTryoutSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await adminService.updateTryout(id, parsed.data);

    return c.json({
      ok: true,
      message: "Tryout berhasil diperbarui",
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memperbarui tryout.");
  }
}

async function updateTryoutStatus(c: AdminContext) {
  try {
    const id = getRequiredParam(c, "id");

    const body = await c.req.json().catch(() => null);

    const parsed = adminTryoutStatusSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: "Status tryout tidak valid",
        },
        400,
      );
    }

    const result = await adminService.updateTryoutStatus(id, parsed.data);

    return c.json({
      ok: true,
      message: "Status tryout berhasil diperbarui",
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memperbarui status tryout.");
  }
}

async function deleteTryout(c: AdminContext) {
  try {
    const id = getRequiredParam(c, "id");

    await adminService.deleteTryout(id);

    return c.json({
      ok: true,
      message: "Tryout berhasil dihapus",
    });
  } catch (error) {
    return handleError(c, error, "Gagal menghapus tryout.");
  }
}

async function getTryoutResults(c: AdminContext) {
  try {
    const id = getRequiredParam(c, "id");

    const result = await adminService.getTryoutResults(id);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat hasil tryout.");
  }
}

async function getTryoutStatistics(c: AdminContext) {
  try {
    const id = getRequiredParam(c, "id");

    const result = await adminService.getTryoutStatistics(id);

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
  getQuestionBanks,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,

  getTryouts,
  getTryoutById,
  createTryout,
  updateTryout,
  updateTryoutStatus,
  deleteTryout,

  getTryoutResults,
  getTryoutStatistics,
};
