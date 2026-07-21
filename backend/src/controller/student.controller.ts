import type { Context } from "hono";
import studentService, {
  StudentServiceError,
} from "../service/student.service.js";
import {
  answerQuestionSchema,
  startTryoutSchema,
} from "../schema/student.schema.js";
import type { AppEnv } from "../types/hono.js";

type StudentContext = Context<AppEnv>;

function getErrorStatus(error: unknown) {
  if (error instanceof StudentServiceError) {
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

function getRequiredParam(c: StudentContext, key: string) {
  const value = c.req.param(key);

  if (!value) {
    throw new StudentServiceError(`${key} wajib dikirim`, 400);
  }

  return value;
}

function handleError(c: StudentContext, error: unknown, fallback?: string) {
  return c.json(
    {
      ok: false,
      message: getErrorMessage(error, fallback),
    },
    getErrorStatus(error) as 400 | 401 | 403 | 404 | 409 | 500,
  );
}

async function check(c: StudentContext) {
  const user = c.get("user");

  return c.json({
    ok: true,
    message: "Student authorized",
    user,
  });
}

async function getTryouts(c: StudentContext) {
  try {
    const user = c.get("user");

    const result = await studentService.getTryouts(user.id);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat tryout.");
  }
}

async function startTryout(c: StudentContext) {
  try {
    const user = c.get("user");
    const body = await c.req.json().catch(() => null);

    const parsed = startTryoutSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await studentService.startTryout(user.id, parsed.data);

    return c.json(
      {
        ok: true,
        message: result.message,
        session: result.session,
      },
      result.created ? 201 : 200,
    );
  } catch (error) {
    return handleError(c, error, "Gagal memulai tryout.");
  }
}

async function getSessions(c: StudentContext) {
  try {
    const user = c.get("user");

    const result = await studentService.getSessions(user.id);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat sesi.");
  }
}

async function getNextQuestion(c: StudentContext) {
  try {
    const user = c.get("user");
    const sessionId = getRequiredParam(c, "sessionId");

    const result = await studentService.getNextQuestion(user.id, sessionId);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat soal berikutnya.");
  }
}

async function answerQuestion(c: StudentContext) {
  try {
    const user = c.get("user");
    const sessionId = getRequiredParam(c, "sessionId");

    const body = await c.req.json().catch(() => null);

    const parsed = answerQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await studentService.answerQuestion(
      user.id,
      sessionId,
      parsed.data,
    );

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal menyimpan jawaban.");
  }
}

async function timeoutSession(c: StudentContext) {
  try {
    const user = c.get("user");
    const sessionId = getRequiredParam(c, "sessionId");

    const result = await studentService.timeoutSession(user.id, sessionId);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal menyelesaikan timeout.");
  }
}

async function getSessionResult(c: StudentContext) {
  try {
    const user = c.get("user");
    const sessionId = getRequiredParam(c, "sessionId");

    const result = await studentService.getSessionResult(user.id, sessionId);

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat hasil tryout.");
  }
}

export default {
  check,
  getTryouts,
  startTryout,
  getSessions,
  getNextQuestion,
  answerQuestion,
  timeoutSession,
  getSessionResult,
};
