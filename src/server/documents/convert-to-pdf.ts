import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { getTempAbsolutePath } from "@/lib/storage/paths";

const execFileAsync = promisify(execFile);

const SOFFICE_COMMAND = "soffice";
const CONVERSION_TIMEOUT_MS = 30_000;
const INPUT_DOCX_FILE_NAME = "input.docx";
const OUTPUT_PDF_FILE_NAME = "input.pdf";

const INVALID_DOCX_BUFFER_MESSAGE =
  "El buffer del DOCX es inválido o está vacío.";
const MOTOR_UNAVAILABLE_MESSAGE =
  "El motor de conversión PDF no está disponible.";
const TIMEOUT_MESSAGE = "La conversión PDF excedió el tiempo máximo.";
const CONVERSION_FAILED_MESSAGE = "No se pudo convertir el DOCX a PDF.";
const INVALID_PDF_MESSAGE = "No se generó un PDF válido.";

export type ConvertDocxToPdfInput = {
  docxBuffer: Buffer;
};

export type ConvertDocxToPdfResult = {
  pdfBuffer: Buffer;
};

async function cleanupTempDirectory(tempDir: string): Promise<void> {
  try {
    await rm(tempDir, { recursive: true, force: true });
  } catch {
    // Limpieza best-effort; no propagar detalles de rutas internas.
  }
}

function toConversionError(error: unknown): Error {
  if (error instanceof Error) {
    const errnoError = error as NodeJS.ErrnoException;

    if (errnoError.code === "ENOENT") {
      return new Error(MOTOR_UNAVAILABLE_MESSAGE);
    }

    if (error.name === "AbortError" || errnoError.code === "ETIMEDOUT") {
      return new Error(TIMEOUT_MESSAGE);
    }
  }

  return new Error(CONVERSION_FAILED_MESSAGE);
}

export async function convertDocxToPdf(
  input: ConvertDocxToPdfInput,
): Promise<ConvertDocxToPdfResult> {
  const { docxBuffer } = input;

  if (!Buffer.isBuffer(docxBuffer) || docxBuffer.length === 0) {
    throw new Error(INVALID_DOCX_BUFFER_MESSAGE);
  }

  const tempDir = path.join(getTempAbsolutePath(), randomUUID());
  const inputDocxPath = path.join(tempDir, INPUT_DOCX_FILE_NAME);
  const outputPdfPath = path.join(tempDir, OUTPUT_PDF_FILE_NAME);

  try {
    await mkdir(tempDir, { recursive: true });
    await writeFile(inputDocxPath, docxBuffer);

    try {
      await execFileAsync(
        SOFFICE_COMMAND,
        [
          "--headless",
          "--convert-to",
          "pdf",
          "--outdir",
          tempDir,
          inputDocxPath,
        ],
        {
          signal: AbortSignal.timeout(CONVERSION_TIMEOUT_MS),
        },
      );
    } catch (error) {
      throw toConversionError(error);
    }

    let pdfBuffer: Buffer;

    try {
      pdfBuffer = await readFile(outputPdfPath);
    } catch (error) {
      const errnoError = error as NodeJS.ErrnoException;

      if (errnoError.code === "ENOENT") {
        throw new Error(INVALID_PDF_MESSAGE);
      }

      throw new Error(CONVERSION_FAILED_MESSAGE);
    }

    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new Error(INVALID_PDF_MESSAGE);
    }

    return { pdfBuffer };
  } finally {
    await cleanupTempDirectory(tempDir);
  }
}
