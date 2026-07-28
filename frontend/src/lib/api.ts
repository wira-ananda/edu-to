import { PUBLIC_API_URL } from "$env/static/public";
import { supabase } from "./supabase";

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function isFormDataBody(body: BodyInit | null | undefined) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function getApiUrl(path: string) {
  const baseUrl = PUBLIC_API_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

function getApiErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return "API request failed";
}

async function getAuthToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new ApiError(error.message, 401, error);
  }

  return session?.access_token ?? null;
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  const hasBody = options.body !== undefined && options.body !== null;
  const bodyIsFormData = isFormDataBody(options.body);

  if (hasBody && !bodyIsFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = await getAuthToken();

    if (!token) {
      throw new ApiError("Session tidak ditemukan.", 401, null);
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
  });

  const result = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(getApiErrorMessage(result), response.status, result);
  }

  return result as T;
}
