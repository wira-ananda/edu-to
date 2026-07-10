const maxInputSize = 8 * 1024 * 1024;
const maxOutputSize = 1.5 * 1024 * 1024;
const maxDimension = 1600;

const outputMimeType = "image/webp";
const outputQualities = [0.82, 0.75, 0.68, 0.6];

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export type CompressImageResult = {
  file: File;
  previewUrl: string;
};

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function validateImageFile(file: File) {
  if (!allowedImageTypes.includes(file.type)) {
    throw new Error("Format gambar harus JPG, PNG, atau WEBP.");
  }

  if (file.size > maxInputSize) {
    throw new Error("Ukuran gambar awal maksimal 8 MB.");
  }
}

function getResizedSize(width: number, height: number) {
  if (width <= maxDimension && height <= maxDimension) {
    return {
      width,
      height,
    };
  }

  const ratio = Math.min(maxDimension / width, maxDimension / height);

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function loadImage(file: File) {
  const objectUrl = URL.createObjectURL(file);

  return new Promise<{
    image: HTMLImageElement;
    objectUrl: string;
  }>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        image,
        objectUrl,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal membaca gambar."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputMimeType, quality);
  });
}

function blobToFile(blob: Blob, fileName: string) {
  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");

  return new File([blob], `${nameWithoutExtension}.webp`, {
    type: outputMimeType,
    lastModified: Date.now(),
  });
}

export async function compressQuestionImage(
  file: File,
): Promise<CompressImageResult> {
  validateImageFile(file);

  const { image, objectUrl } = await loadImage(file);

  try {
    const resizedSize = getResizedSize(image.naturalWidth, image.naturalHeight);

    const canvas = document.createElement("canvas");
    canvas.width = resizedSize.width;
    canvas.height = resizedSize.height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Browser tidak mendukung kompresi gambar.");
    }

    context.drawImage(image, 0, 0, resizedSize.width, resizedSize.height);

    let compressedBlob: Blob | null = null;

    for (const quality of outputQualities) {
      compressedBlob = await canvasToBlob(canvas, quality);

      if (compressedBlob && compressedBlob.size <= maxOutputSize) {
        break;
      }
    }

    if (!compressedBlob) {
      throw new Error("Gagal mengompresi gambar.");
    }

    if (compressedBlob.size > maxOutputSize) {
      throw new Error(
        "Gambar masih terlalu besar setelah dikompresi. Gunakan gambar yang lebih kecil.",
      );
    }

    const compressedFile = blobToFile(compressedBlob, file.name);

    return {
      file: compressedFile,
      previewUrl: URL.createObjectURL(compressedFile),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
