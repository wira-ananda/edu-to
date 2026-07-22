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

async function getAuthToken() {
  const { data } = await supabase.auth.getSession();

  return data.session?.access_token ?? null;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const bodyIsFormData = isFormDataBody(options.body);

  if (!bodyIsFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = await getAuthToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      result?.message ?? "API request failed",
      response.status,
      result,
    );
  }

  return result as T;
}
