import { supabaseAdmin } from "./supabase-admin.js";

export type QuestionImageFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type UploadedQuestionImage = {
  imageUrl: string;
  imagePath: string;
};

const questionImageBucket =
  process.env.SUPABASE_QUESTION_IMAGE_BUCKET ?? "question-images";

const maxImageSize = 1.5 * 1024 * 1024;

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

function getImageExtension(file: QuestionImageFile) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return null;
}

function sanitizePathPart(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9-_]/g, "");

  return cleaned || "general";
}

export function isQuestionImageFile(
  value: unknown,
): value is QuestionImageFile {
  if (!value || typeof value !== "object") return false;

  const file = value as Partial<QuestionImageFile>;

  return (
    typeof file.name === "string" &&
    typeof file.type === "string" &&
    typeof file.size === "number" &&
    typeof file.arrayBuffer === "function" &&
    file.size > 0
  );
}

export function validateQuestionImage(file: QuestionImageFile) {
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      ok: false as const,
      message: "Format gambar harus JPG, PNG, atau WEBP.",
    };
  }

  if (file.size > maxImageSize) {
    return {
      ok: false as const,
      message: "Ukuran gambar maksimal 1.5 MB setelah kompresi.",
    };
  }

  return {
    ok: true as const,
  };
}

export async function uploadQuestionImage(
  file: QuestionImageFile,
  subjectId: string,
): Promise<UploadedQuestionImage> {
  const validation = validateQuestionImage(file);

  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const extension = getImageExtension(file);

  if (!extension) {
    throw new Error("Format gambar tidak valid.");
  }

  const safeSubjectId = sanitizePathPart(subjectId);
  const randomName = crypto.randomUUID();
  const timestamp = Date.now();

  const imagePath = `questions/${safeSubjectId}/${timestamp}-${randomName}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const fileBody = new Uint8Array(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from(questionImageBucket)
    .upload(imagePath, fileBody, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabaseAdmin.storage
    .from(questionImageBucket)
    .getPublicUrl(imagePath);

  return {
    imageUrl: data.publicUrl,
    imagePath,
  };
}

export async function deleteQuestionImage(imagePath?: string | null) {
  if (!imagePath) return;

  const { error } = await supabaseAdmin.storage
    .from(questionImageBucket)
    .remove([imagePath]);

  if (error) {
    console.warn("Failed to delete question image:", error.message);
  }
}
