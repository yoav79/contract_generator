import {
  TemplateStatus,
  TemplateVersionStatus,
  UserRole,
} from "@prisma/client";

import { isLawyer } from "@/lib/auth/authorization";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit/log";
import { db } from "@/lib/db";
import {
  removeStoredDocx,
  saveUploadedDocx,
  validateDocxFile,
} from "@/lib/storage/docx";

const INITIAL_VERSION_NUMBER = 1;

export type CreateTemplateWithDocxParams = {
  userId: string;
  userRole: UserRole;
  name: string;
  description?: string | null;
  file: File;
};

export type CreateTemplateWithDocxResult = {
  templateId: string;
  templateVersionId: string;
  name: string;
  status: TemplateStatus;
  version: number;
  originalFileName: string;
  fileSizeBytes: number;
  docxSha256: string;
};

async function cleanupCreatedTemplate(templateId: string): Promise<void> {
  try {
    await db.contractTemplate.delete({
      where: { id: templateId },
    });
  } catch {
    // La compensación es best-effort; el error original se propaga al caller.
  }
}

async function cleanupStoredDocx(relativePath: string): Promise<void> {
  try {
    await removeStoredDocx(relativePath);
  } catch {
    // La compensación es best-effort; el error original se propaga al caller.
  }
}

export async function createTemplateWithDocx(
  params: CreateTemplateWithDocxParams,
): Promise<CreateTemplateWithDocxResult> {
  const { userId, userRole, name, description, file } = params;

  if (!isLawyer(userRole)) {
    throw new Error("No autorizado: solo abogados pueden crear templates.");
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("El nombre del template es requerido.");
  }

  if (!file) {
    throw new Error("El archivo DOCX es requerido.");
  }

  validateDocxFile(file);

  const template = await db.contractTemplate.create({
    data: {
      name: trimmedName,
      description: description?.trim() ? description.trim() : null,
      status: TemplateStatus.DRAFT,
      createdById: userId,
    },
  });

  const templateVersion = await db.contractTemplateVersion.create({
    data: {
      templateId: template.id,
      version: INITIAL_VERSION_NUMBER,
      status: TemplateVersionStatus.DRAFT,
    },
  });

  let storedRelativePath: string | null = null;

  try {
    const savedDocx = await saveUploadedDocx({
      file,
      templateId: template.id,
      versionNumber: INITIAL_VERSION_NUMBER,
    });

    storedRelativePath = savedDocx.relativePath;

    await db.contractTemplateVersion.update({
      where: { id: templateVersion.id },
      data: {
        docxPath: savedDocx.relativePath,
        docxSha256: savedDocx.sha256,
        originalFileName: savedDocx.originalFileName,
        fileSizeBytes: savedDocx.fileSizeBytes,
        mimeType: savedDocx.mimeType,
      },
    });

    // El filesystem no participa en transacciones Prisma; la auditoría va al final.
    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.TEMPLATE_CREATED,
      entityType: "ContractTemplate",
      entityId: template.id,
      metadata: {
        name: trimmedName,
        status: TemplateStatus.DRAFT,
      },
    });

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.TEMPLATE_VERSION_CREATED,
      entityType: "ContractTemplateVersion",
      entityId: templateVersion.id,
      metadata: {
        templateId: template.id,
        version: INITIAL_VERSION_NUMBER,
        status: TemplateVersionStatus.DRAFT,
      },
    });

    await createAuditLog({
      userId,
      action: AUDIT_ACTIONS.TEMPLATE_UPLOAD_STORED,
      entityType: "ContractTemplateVersion",
      entityId: templateVersion.id,
      metadata: {
        templateId: template.id,
        version: INITIAL_VERSION_NUMBER,
        docxSha256: savedDocx.sha256,
        originalFileName: savedDocx.originalFileName,
        fileSizeBytes: savedDocx.fileSizeBytes,
        mimeType: savedDocx.mimeType,
      },
    });

    return {
      templateId: template.id,
      templateVersionId: templateVersion.id,
      name: template.name,
      status: template.status,
      version: INITIAL_VERSION_NUMBER,
      originalFileName: savedDocx.originalFileName,
      fileSizeBytes: savedDocx.fileSizeBytes,
      docxSha256: savedDocx.sha256,
    };
  } catch (error) {
    if (storedRelativePath) {
      await cleanupStoredDocx(storedRelativePath);
    }

    await cleanupCreatedTemplate(template.id);

    throw error;
  }
}
