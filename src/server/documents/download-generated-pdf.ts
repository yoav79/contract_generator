import {
  GeneratedDocumentStatus,
  Prisma,
  UserRole,
} from "@prisma/client";

import { AUDIT_ACTIONS } from "@/lib/audit/log";
import { isAdminStaff } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import { readStoredPdf } from "@/lib/storage/generated-pdf";

export const DOWNLOAD_UNAUTHORIZED_MESSAGE =
  "No autorizado para descargar documentos.";
export const DOWNLOAD_MISSING_USER_MESSAGE = "El usuario es requerido.";
export const DOWNLOAD_MISSING_DOCUMENT_ID_MESSAGE =
  "El documento generado es requerido.";
export const DOWNLOAD_NOT_AVAILABLE_MESSAGE =
  "El documento no está disponible para descarga.";
export const DOWNLOAD_FAILED_MESSAGE = "No se pudo descargar el documento.";

export const DOWNLOAD_NOT_FOUND_MESSAGES = new Set([
  DOWNLOAD_MISSING_DOCUMENT_ID_MESSAGE,
  DOWNLOAD_NOT_AVAILABLE_MESSAGE,
]);

export type DownloadGeneratedPdfParams = {
  generatedDocumentId: string;
  userId: string;
  userRole: UserRole;
};

export type DownloadGeneratedPdfResult = {
  generatedDocumentId: string;
  fileName: string;
  pdfBuffer: Buffer;
};

function buildFileName(generatedDocumentId: string): string {
  return `documento-${generatedDocumentId}.pdf`;
}

function isPdfReadError(message: string): boolean {
  return (
    message === "El archivo PDF almacenado no existe." ||
    message === "La ruta no corresponde a un archivo PDF válido." ||
    message === "No se pudo leer el archivo PDF almacenado." ||
    message === "El archivo PDF almacenado está vacío." ||
    message === "El archivo PDF almacenado no es válido." ||
    message === "La ruta no pertenece al almacenamiento de documentos generados." ||
    message === "La ruta de storage debe ser relativa." ||
    message === 'La ruta de storage debe comenzar con "storage/".' ||
    message === "La ruta relativa escapa del directorio de storage." ||
    message === "La ruta no pertenece al directorio de storage."
  );
}

/**
 * Orquesta validación, lectura privada del PDF y auditoría de descarga.
 *
 * Solo sirve PDFs bajo storage/generated/; nunca expone rutas ni DOCX.
 */
export async function downloadGeneratedPdf(
  params: DownloadGeneratedPdfParams,
): Promise<DownloadGeneratedPdfResult> {
  const { generatedDocumentId, userId, userRole } = params;

  if (!isAdminStaff(userRole)) {
    throw new Error(DOWNLOAD_UNAUTHORIZED_MESSAGE);
  }

  const trimmedUserId = userId.trim();

  if (!trimmedUserId) {
    throw new Error(DOWNLOAD_MISSING_USER_MESSAGE);
  }

  const trimmedGeneratedDocumentId = generatedDocumentId.trim();

  if (!trimmedGeneratedDocumentId) {
    throw new Error(DOWNLOAD_MISSING_DOCUMENT_ID_MESSAGE);
  }

  const document = await db.generatedDocument.findUnique({
    where: { id: trimmedGeneratedDocumentId },
    include: {
      version: {
        include: {
          template: true,
        },
      },
    },
  });

  if (!document) {
    throw new Error(DOWNLOAD_NOT_AVAILABLE_MESSAGE);
  }

  if (document.status !== GeneratedDocumentStatus.COMPLETED) {
    throw new Error(DOWNLOAD_NOT_AVAILABLE_MESSAGE);
  }

  if (!document.pdfPath) {
    throw new Error(DOWNLOAD_NOT_AVAILABLE_MESSAGE);
  }

  const templateId = document.version.templateId;
  const versionId = document.versionId;

  let pdfBuffer: Buffer;

  try {
    pdfBuffer = await readStoredPdf(document.pdfPath);
  } catch (error) {
    if (error instanceof Error && isPdfReadError(error.message)) {
      throw new Error(DOWNLOAD_NOT_AVAILABLE_MESSAGE);
    }

    throw new Error(DOWNLOAD_FAILED_MESSAGE);
  }

  await db.auditLog.create({
    data: {
      userId: trimmedUserId,
      action: AUDIT_ACTIONS.GENERATED_DOCUMENT_DOWNLOADED,
      entityType: "GeneratedDocument",
      entityId: trimmedGeneratedDocumentId,
      metadata: {
        generatedDocumentId: trimmedGeneratedDocumentId,
        templateId,
        versionId,
      } as Prisma.InputJsonValue,
    },
  });

  return {
    generatedDocumentId: trimmedGeneratedDocumentId,
    fileName: buildFileName(trimmedGeneratedDocumentId),
    pdfBuffer,
  };
}
