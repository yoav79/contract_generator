import {
  GeneratedDocumentStatus,
  Prisma,
  UserRole,
} from "@prisma/client";

import { AUDIT_ACTIONS } from "@/lib/audit/log";
import { isAdminStaff } from "@/lib/auth/authorization";
import { db } from "@/lib/db";
import { mapValuesForDocxRender } from "@/lib/forms/map-values-for-docx-render";
import { validateTemplateFormData } from "@/lib/forms/validate-template-form-data";
import { readStoredDocx } from "@/lib/storage/docx";
import {
  removeGeneratedDocx,
  saveGeneratedDocx,
} from "@/lib/storage/generated-docx";
import { getPublishedTemplateForGeneration } from "@/server/templates/get-published-template-for-generation";

import { generatePdfForDocument } from "./generate-pdf-for-document";
import { renderDocx } from "./render-docx";

const UNAUTHORIZED_MESSAGE = "No autorizado para generar documentos.";
const MISSING_USER_MESSAGE = "El usuario es requerido.";
const MISSING_TEMPLATE_MESSAGE = "El template es requerido.";
const TEMPLATE_UNAVAILABLE_MESSAGE =
  "El template ya no está disponible para generación.";
const INVALID_FORM_DATA_MESSAGE = "Los datos del formulario no son válidos.";
const GENERATION_FAILED_MESSAGE = "No se pudo generar el documento.";

export type GenerateContractDocumentParams = {
  userId: string;
  userRole: UserRole;
  templateId: string;
  formData: Record<string, string | number | boolean | null>;
};

export type GenerateContractDocumentResult = {
  generatedDocumentId: string;
  status: GeneratedDocumentStatus;
  templateId: string;
  versionId: string;
  fieldCount: number;
  pdfCreated: boolean;
};

async function markGeneratedDocumentFailed(
  generatedDocumentId: string,
): Promise<void> {
  try {
    await db.generatedDocument.update({
      where: { id: generatedDocumentId },
      data: { status: GeneratedDocumentStatus.FAILED },
    });
  } catch {
    // Compensación best-effort; el error genérico se propaga al caller.
  }
}

async function cleanupGeneratedDocx(relativePath: string): Promise<void> {
  try {
    await removeGeneratedDocx(relativePath);
  } catch {
    // Compensación best-effort; el error genérico se propaga al caller.
  }
}

/**
 * Orquesta validación, render DOCX, almacenamiento privado y registro en BD.
 *
 * El filesystem no participa en transacciones Prisma: si el archivo se guarda
 * pero falla la actualización en BD, se elimina el DOCX generado y el registro
 * queda en FAILED (sin borrar el GeneratedDocument).
 */
export async function generateContractDocument(
  params: GenerateContractDocumentParams,
): Promise<GenerateContractDocumentResult> {
  const { userId, userRole, templateId, formData } = params;

  if (!isAdminStaff(userRole)) {
    throw new Error(UNAUTHORIZED_MESSAGE);
  }

  const trimmedUserId = userId.trim();

  if (!trimmedUserId) {
    throw new Error(MISSING_USER_MESSAGE);
  }

  const trimmedTemplateId = templateId.trim();

  if (!trimmedTemplateId) {
    throw new Error(MISSING_TEMPLATE_MESSAGE);
  }

  const template = await getPublishedTemplateForGeneration(trimmedTemplateId);

  if (!template) {
    throw new Error(TEMPLATE_UNAVAILABLE_MESSAGE);
  }

  if (!template.docxPath) {
    throw new Error(TEMPLATE_UNAVAILABLE_MESSAGE);
  }

  const validation = validateTemplateFormData(template.fields, formData);

  if (!validation.success) {
    throw new Error(INVALID_FORM_DATA_MESSAGE);
  }

  const fieldCount = template.fields.length;

  const generatedDocument = await db.generatedDocument.create({
    data: {
      versionId: template.versionId,
      generatedById: trimmedUserId,
      status: GeneratedDocumentStatus.PENDING,
      formData: validation.values as Prisma.InputJsonValue,
      docxPath: null,
      pdfPath: null,
    },
  });

  let savedDocxRelativePath: string | null = null;

  try {
    const templateDocxBuffer = await readStoredDocx(template.docxPath);
    const renderValues = mapValuesForDocxRender(
      validation.values,
      template.fields,
    );
    const { docxBuffer } = await renderDocx({
      templateDocxBuffer,
      values: renderValues,
    });

    savedDocxRelativePath = await saveGeneratedDocx({
      generatedDocumentId: generatedDocument.id,
      docxBuffer,
    });

    await db.$transaction(async (tx) => {
      await tx.generatedDocument.update({
        where: { id: generatedDocument.id },
        data: {
          status: GeneratedDocumentStatus.COMPLETED,
          docxPath: savedDocxRelativePath,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: trimmedUserId,
          action: AUDIT_ACTIONS.GENERATED_DOCUMENT_CREATED,
          entityType: "GeneratedDocument",
          entityId: generatedDocument.id,
          metadata: {
            templateId: template.templateId,
            versionId: template.versionId,
            generatedDocumentId: generatedDocument.id,
            fieldCount,
          } as Prisma.InputJsonValue,
        },
      });
    });

    let pdfCreated = false;

    try {
      const pdfResult = await generatePdfForDocument({
        generatedDocumentId: generatedDocument.id,
        userId: trimmedUserId,
        userRole,
      });

      pdfCreated = pdfResult.pdfCreated;
    } catch {
      // El DOCX ya está COMPLETED; el fallo de PDF no invalida la generación.
      pdfCreated = false;
    }

    return {
      generatedDocumentId: generatedDocument.id,
      status: GeneratedDocumentStatus.COMPLETED,
      templateId: template.templateId,
      versionId: template.versionId,
      fieldCount,
      pdfCreated,
    };
  } catch {
    if (savedDocxRelativePath) {
      await cleanupGeneratedDocx(savedDocxRelativePath);
    }

    await markGeneratedDocumentFailed(generatedDocument.id);

    throw new Error(GENERATION_FAILED_MESSAGE);
  }
}
