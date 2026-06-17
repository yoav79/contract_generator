import { createHash } from "node:crypto";
import { mkdir, readFile, rmdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  getTemplatesAbsolutePath,
  resolveRelativeStoragePath,
  toRelativeStoragePath,
} from "./paths";

export const MAX_DOCX_SIZE_BYTES = 10 * 1024 * 1024;

export const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const GENERIC_MIME_TYPES = new Set(["", "application/octet-stream"]);

const DOCX_FILE_NAME = "source.docx";

export type SaveUploadedDocxParams = {
  file: File;
  templateId: string;
  versionNumber: number;
};

export type SavedDocxMetadata = {
  relativePath: string;
  sha256: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
};

export function validateDocxFile(file: File): void {
  if (!file) {
    throw new Error("El archivo DOCX es requerido.");
  }

  const originalFileName = file.name.trim();

  if (!originalFileName) {
    throw new Error("El archivo DOCX es requerido.");
  }

  if (!originalFileName.toLowerCase().endsWith(".docx")) {
    throw new Error("El archivo debe tener extensión .docx.");
  }

  if (file.size <= 0) {
    throw new Error("El archivo DOCX no puede estar vacío.");
  }

  if (file.size > MAX_DOCX_SIZE_BYTES) {
    throw new Error("El archivo DOCX supera el tamaño máximo permitido de 10 MB.");
  }

  const mimeType = file.type.trim();

  if (
    mimeType &&
    !GENERIC_MIME_TYPES.has(mimeType) &&
    mimeType !== DOCX_MIME_TYPE
  ) {
    throw new Error("El tipo MIME del archivo no corresponde a un DOCX válido.");
  }
}

export function calculateSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function resolveStoredMimeType(file: File): string {
  const mimeType = file.type.trim();

  if (mimeType === DOCX_MIME_TYPE) {
    return DOCX_MIME_TYPE;
  }

  return DOCX_MIME_TYPE;
}

function assertSafePathSegment(value: string, label: string): void {
  if (!value || value.includes("/") || value.includes("\\") || value.includes("..")) {
    throw new Error(`${label} inválido para almacenamiento.`);
  }
}

export async function saveUploadedDocx(
  params: SaveUploadedDocxParams,
): Promise<SavedDocxMetadata> {
  const { file, templateId, versionNumber } = params;

  validateDocxFile(file);

  assertSafePathSegment(templateId, "templateId");

  if (!Number.isInteger(versionNumber) || versionNumber < 1) {
    throw new Error("versionNumber debe ser un entero mayor o igual a 1.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length <= 0) {
    throw new Error("El archivo DOCX no puede estar vacío.");
  }

  if (buffer.length > MAX_DOCX_SIZE_BYTES) {
    throw new Error("El archivo DOCX supera el tamaño máximo permitido de 10 MB.");
  }

  if (!file.name.trim().toLowerCase().endsWith(".docx")) {
    throw new Error("El archivo debe tener extensión .docx.");
  }

  const sha256 = calculateSha256(buffer);
  const originalFileName = file.name.trim();
  const fileSizeBytes = buffer.length;
  const mimeType = resolveStoredMimeType(file);

  const versionDirectory = path.join(
    getTemplatesAbsolutePath(),
    templateId,
    `v${versionNumber}`,
  );
  const absoluteFilePath = path.join(versionDirectory, DOCX_FILE_NAME);

  await mkdir(versionDirectory, { recursive: true });
  await writeFile(absoluteFilePath, buffer);

  const relativePath = toRelativeStoragePath(absoluteFilePath);

  return {
    relativePath,
    sha256,
    originalFileName,
    fileSizeBytes,
    mimeType,
  };
}

export async function readStoredDocx(relativePath: string): Promise<Buffer> {
  const absoluteFilePath = resolveRelativeStoragePath(relativePath);

  try {
    return await readFile(absoluteFilePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT") {
      throw new Error("El archivo DOCX almacenado no existe.");
    }

    if (code === "EISDIR") {
      throw new Error("La ruta no corresponde a un archivo DOCX válido.");
    }

    throw error;
  }
}

export async function removeStoredDocx(relativePath: string): Promise<void> {
  const absoluteFilePath = resolveRelativeStoragePath(relativePath);

  try {
    await unlink(absoluteFilePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  const templatesRoot = path.resolve(getTemplatesAbsolutePath());
  let currentDir = path.dirname(absoluteFilePath);

  while (
    currentDir !== templatesRoot &&
    currentDir.startsWith(`${templatesRoot}${path.sep}`)
  ) {
    try {
      await rmdir(currentDir);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === "ENOTEMPTY" || code === "ENOENT") {
        break;
      }

      throw error;
    }

    currentDir = path.dirname(currentDir);
  }
}
