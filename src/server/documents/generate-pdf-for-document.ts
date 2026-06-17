import {
  GeneratedDocumentStatus,
  Prisma,
  UserRole,
} from "@prisma/client";

import { AUDIT_ACTIONS } from "@/lib/audit/log";
import { isAdminStaff } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import { readStoredDocx } from "@/lib/storage/docx";
import {
  removeGeneratedPdf,
  saveGeneratedPdf,
} from "@/lib/storage/generated-pdf";

import { convertDocxToPdf } from "./convert-to-pdf";

const UNAUTHORIZED_MESSAGE = "No autorizado para generar PDF de documentos.";
const MISSING_USER_MESSAGE = "El usuario es requerido.";
const MISSING_DOCUMENT_ID_MESSAGE = "El documento generado es requerido.";
const DOCUMENT_NOT_FOUND_MESSAGE = "El documento generado no existe.";
const DOCUMENT_NOT_COMPLETED_MESSAGE =
  "El documento no está listo para conversión a PDF.";
const MISSING_DOCX_MESSAGE = "El documento no tiene un DOCX disponible.";
const PDF_ALREADY_EXISTS_MESSAGE = "El documento ya tiene un PDF generado.";
const PDF_GENERATION_FAILED_MESSAGE = "No se pudo generar el PDF del documento.";

export type GeneratePdfForDocumentParams = {
  generatedDocumentId: string;
  userId: string;
  userRole: UserRole;
};

export type GeneratePdfForDocumentResult = {
  generatedDocumentId: string;
  status: GeneratedDocumentStatus;
  versionId: string;
  templateId: string;
  pdfCreated: boolean;
};

async function cleanupGeneratedPdf(relativePath: string): Promise<void> {
  try {
    await removeGeneratedPdf(relativePath);
  } catch {
    // Compensación best-effort; el error genérico se propaga al caller.
  }
}

/**
 * Orquesta conversión DOCX → PDF, almacenamiento privado y registro en BD.
 *
 * El filesystem no participa en transacciones Prisma: si el PDF se guarda
 * pero falla la actualización en BD, se elimina el PDF generado. Un fallo de
 * conversión PDF no marca el GeneratedDocument como FAILED ni borra el DOCX.
 */
export async function generatePdfForDocument(
  params: GeneratePdfForDocumentParams,
): Promise<GeneratePdfForDocumentResult> {
  const { generatedDocumentId, userId, userRole } = params;

  if (!isAdminStaff(userRole)) {
    throw new Error(UNAUTHORIZED_MESSAGE);
  }

  const trimmedUserId = userId.trim();

  if (!trimmedUserId) {
    throw new Error(MISSING_USER_MESSAGE);
  }

  const trimmedGeneratedDocumentId = generatedDocumentId.trim();

  if (!trimmedGeneratedDocumentId) {
    throw new Error(MISSING_DOCUMENT_ID_MESSAGE);
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
    throw new Error(DOCUMENT_NOT_FOUND_MESSAGE);
  }

  if (document.status !== GeneratedDocumentStatus.COMPLETED) {
    throw new Error(DOCUMENT_NOT_COMPLETED_MESSAGE);
  }

  if (!document.docxPath) {
    throw new Error(MISSING_DOCX_MESSAGE);
  }

  if (document.pdfPath) {
    throw new Error(PDF_ALREADY_EXISTS_MESSAGE);
  }

  const templateId = document.version.templateId;
  const versionId = document.versionId;

  let savedPdfRelativePath: string | null = null;

  try {
    const docxBuffer = await readStoredDocx(document.docxPath);
    const { pdfBuffer } = await convertDocxToPdf({ docxBuffer });

    savedPdfRelativePath = await saveGeneratedPdf({
      generatedDocumentId: trimmedGeneratedDocumentId,
      pdfBuffer,
    });

    await db.$transaction(async (tx) => {
      await tx.generatedDocument.update({
        where: { id: trimmedGeneratedDocumentId },
        data: {
          pdfPath: savedPdfRelativePath,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: trimmedUserId,
          action: AUDIT_ACTIONS.GENERATED_DOCUMENT_PDF_CREATED,
          entityType: "GeneratedDocument",
          entityId: trimmedGeneratedDocumentId,
          metadata: {
            templateId,
            versionId,
            generatedDocumentId: trimmedGeneratedDocumentId,
          } as Prisma.InputJsonValue,
        },
      });
    });

    return {
      generatedDocumentId: trimmedGeneratedDocumentId,
      status: GeneratedDocumentStatus.COMPLETED,
      versionId,
      templateId,
      pdfCreated: true,
    };
  } catch (error) {
    if (savedPdfRelativePath) {
      await cleanupGeneratedPdf(savedPdfRelativePath);
    }

    if (error instanceof Error) {
      const knownMessages = new Set([
        DOCUMENT_NOT_FOUND_MESSAGE,
        DOCUMENT_NOT_COMPLETED_MESSAGE,
        MISSING_DOCX_MESSAGE,
        PDF_ALREADY_EXISTS_MESSAGE,
        UNAUTHORIZED_MESSAGE,
        MISSING_USER_MESSAGE,
        MISSING_DOCUMENT_ID_MESSAGE,
      ]);

      if (knownMessages.has(error.message)) {
        throw error;
      }
    }

    throw new Error(PDF_GENERATION_FAILED_MESSAGE);
  }
}
