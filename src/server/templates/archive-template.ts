import {
  Prisma,
  TemplateStatus,
  TemplateVersionStatus,
  UserRole,
} from "@prisma/client";

import { isLawyer } from "@/lib/auth/authorization";
import { AUDIT_ACTIONS } from "@/lib/audit/log";
import { db } from "@/lib/db";

export type ArchiveTemplateParams = {
  userId: string;
  userRole: UserRole;
  templateId: string;
};

export type ArchiveTemplateResult = {
  templateId: string;
  versionId: string;
  version: number;
  templateStatus: TemplateStatus;
  versionStatus: TemplateVersionStatus;
  publishedAt: Date;
};

export async function archiveTemplate(
  params: ArchiveTemplateParams,
): Promise<ArchiveTemplateResult> {
  const { userId, userRole, templateId } = params;

  if (!isLawyer(userRole)) {
    throw new Error("No autorizado: solo abogados pueden archivar templates.");
  }

  const trimmedTemplateId = templateId.trim();

  if (!trimmedTemplateId) {
    throw new Error("El template es requerido.");
  }

  const template = await db.contractTemplate.findUnique({
    where: { id: trimmedTemplateId },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!template) {
    throw new Error("Template no encontrado.");
  }

  if (template.createdById !== userId) {
    throw new Error("No autorizado: el template no pertenece al abogado.");
  }

  if (template.status !== TemplateStatus.PUBLISHED) {
    throw new Error("Solo se pueden archivar templates publicados.");
  }

  const version = template.versions[0];

  if (!version) {
    throw new Error("No se encontró una versión del template.");
  }

  if (version.status !== TemplateVersionStatus.PUBLISHED) {
    throw new Error("Solo se pueden archivar versiones publicadas.");
  }

  if (!version.publishedAt) {
    throw new Error("La versión publicada no tiene fecha de publicación.");
  }

  const previousTemplateStatus = template.status;
  const previousVersionStatus = version.status;
  const publishedAt = version.publishedAt;

  await db.$transaction(async (tx) => {
    await tx.contractTemplate.update({
      where: { id: template.id },
      data: { status: TemplateStatus.ARCHIVED },
    });

    await tx.contractTemplateVersion.update({
      where: { id: version.id },
      data: { status: TemplateVersionStatus.ARCHIVED },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: AUDIT_ACTIONS.TEMPLATE_ARCHIVED,
        entityType: "ContractTemplate",
        entityId: template.id,
        metadata: {
          versionId: version.id,
          version: version.version,
          publishedAt: publishedAt.toISOString(),
          previousTemplateStatus,
          previousVersionStatus,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return {
    templateId: template.id,
    versionId: version.id,
    version: version.version,
    templateStatus: TemplateStatus.ARCHIVED,
    versionStatus: TemplateVersionStatus.ARCHIVED,
    publishedAt,
  };
}
