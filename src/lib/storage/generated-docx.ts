import { mkdir, rmdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  getGeneratedAbsolutePath,
  resolveRelativeStoragePath,
  toRelativeStoragePath,
} from "./paths";

const GENERATED_DOCX_FILE_NAME = "document.docx";
const GENERATED_STORAGE_PREFIX = "storage/generated/";

export type SaveGeneratedDocxParams = {
  generatedDocumentId: string;
  docxBuffer: Buffer;
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

export async function saveGeneratedDocx(
  params: SaveGeneratedDocxParams,
): Promise<string> {
  const { generatedDocumentId, docxBuffer } = params;

  const trimmedId = generatedDocumentId.trim();

  if (!trimmedId) {
    throw new Error("El identificador del documento generado es requerido.");
  }

  assertSafePathSegment(trimmedId, "generatedDocumentId");

  if (!Buffer.isBuffer(docxBuffer) || docxBuffer.length === 0) {
    throw new Error("El buffer del DOCX generado es inválido o está vacío.");
  }

  const documentDirectory = path.join(getGeneratedAbsolutePath(), trimmedId);
  const absoluteFilePath = path.join(documentDirectory, GENERATED_DOCX_FILE_NAME);

  await mkdir(documentDirectory, { recursive: true });
  await writeFile(absoluteFilePath, docxBuffer);

  return toRelativeStoragePath(absoluteFilePath);
}

export async function removeGeneratedDocx(relativePath: string): Promise<void> {
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
