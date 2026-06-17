import { mkdir, readFile, rmdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  getGeneratedAbsolutePath,
  resolveRelativeStoragePath,
  toRelativeStoragePath,
} from "./paths";

const GENERATED_PDF_FILE_NAME = "document.pdf";
const GENERATED_STORAGE_PREFIX = "storage/generated/";
const PDF_MAGIC_BYTES = "%PDF-";

export type SaveGeneratedPdfParams = {
  generatedDocumentId: string;
  pdfBuffer: Buffer;
};

function assertSafePathSegment(value: string, label: string): void {
  if (!value || value.includes("/") || value.includes("\\") || value.includes("..")) {
    throw new Error(`${label} inválido para almacenamiento.`);
  }
}

function assertGeneratedRelativePath(relativePath: string): void {
  const normalized = relativePath.replace(/\\/g, "/");

  if (!normalized.startsWith(GENERATED_STORAGE_PREFIX)) {
    throw new Error("La ruta no pertenece al almacenamiento de documentos generados.");
  }
}

export async function saveGeneratedPdf(
  params: SaveGeneratedPdfParams,
): Promise<string> {
  const { generatedDocumentId, pdfBuffer } = params;

  const trimmedId = generatedDocumentId.trim();

  if (!trimmedId) {
    throw new Error("El identificador del documento generado es requerido.");
  }

  assertSafePathSegment(trimmedId, "generatedDocumentId");

  if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
    throw new Error("El buffer del PDF generado es inválido o está vacío.");
  }

  const documentDirectory = path.join(getGeneratedAbsolutePath(), trimmedId);
  const absoluteFilePath = path.join(documentDirectory, GENERATED_PDF_FILE_NAME);

  await mkdir(documentDirectory, { recursive: true });
  await writeFile(absoluteFilePath, pdfBuffer);

  return toRelativeStoragePath(absoluteFilePath);
}

export async function readStoredPdf(relativePath: string): Promise<Buffer> {
  assertGeneratedRelativePath(relativePath);

  const absoluteFilePath = resolveRelativeStoragePath(relativePath);

  let buffer: Buffer;

  try {
    buffer = await readFile(absoluteFilePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT") {
      throw new Error("El archivo PDF almacenado no existe.");
    }

    if (code === "EISDIR") {
      throw new Error("La ruta no corresponde a un archivo PDF válido.");
    }

    throw new Error("No se pudo leer el archivo PDF almacenado.");
  }

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("El archivo PDF almacenado está vacío.");
  }

  if (buffer.subarray(0, PDF_MAGIC_BYTES.length).toString("ascii") !== PDF_MAGIC_BYTES) {
    throw new Error("El archivo PDF almacenado no es válido.");
  }

  return buffer;
}

export async function removeGeneratedPdf(relativePath: string): Promise<void> {
  assertGeneratedRelativePath(relativePath);

  const absoluteFilePath = resolveRelativeStoragePath(relativePath);

  try {
    await unlink(absoluteFilePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  const generatedRoot = path.resolve(getGeneratedAbsolutePath());
  let currentDir = path.dirname(absoluteFilePath);

  while (
    currentDir !== generatedRoot &&
    currentDir.startsWith(`${generatedRoot}${path.sep}`)
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
