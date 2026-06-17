import {
  Prisma,
  TemplateStatus,
  TemplateVersionStatus,
  UserRole,
} from "@prisma/client";

import { isLawyer } from "@/lib/auth/authorization";
import { AUDIT_ACTIONS } from "@/lib/audit/log";
import { db } from "@/lib/db";

const MAX_LABEL_LENGTH = 120;

export type PublishTemplateParams = {
  userId: string;
  userRole: UserRole;
  templateId: string;
};

export type PublishTemplateResult = {
  templateId: string;
  versionId: string;
  version: number;
  templateStatus: TemplateStatus;
  versionStatus: TemplateVersionStatus;
  publishedAt: Date;
  fieldCount: number;
};

function validateFieldLabels(
  fields: Array<{ key: string; label: string }>,
): void {
  for (const field of fields) {
    const trimmedLabel = field.label.trim();

    if (!trimmedLabel) {
      throw new Error(
        `El campo "${field.key}" no tiene un label válido.`,
      );
    }

    if (trimmedLabel.length > MAX_LABEL_LENGTH) {
      throw new Error(
        `El label del campo "${field.key}" no puede superar ${MAX_LABEL_LENGTH} caracteres.`,
      );
    }
  }
}

export async function publishTemplate(
  params: PublishTemplateParams,
): Promise<PublishTemplateResult> {
  const { userId, userRole, templateId } = params;

  if (!isLawyer(userRole)) {
    throw new Error("No autorizado: solo abogados pueden publicar templates.");
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
        include: {
          fields: true,
        },
      },
    },
  });

  if (!template) {
    throw new Error("Template no encontrado.");
  }

  if (template.createdById !== userId) {
    throw new Error("No autorizado: el template no pertenece al abogado.");
  }

  if (template.status !== TemplateStatus.DRAFT) {
    throw new Error("Solo se pueden publicar templates en borrador.");
  }

  const version = template.versions[0];

  if (!version) {
    throw new Error("No se encontró una versión del template.");
  }

  if (version.status !== TemplateVersionStatus.DRAFT) {
    throw new Error("Solo se pueden publicar versiones en borrador.");
  }

  if (!version.docxPath) {
    throw new Error("La versión no tiene un archivo DOCX asociado.");
  }

  const fields = version.fields;

  if (fields.length < 1) {
    throw new Error(
      "El template debe tener al menos un campo configurado antes de publicarse.",
    );
  }

  validateFieldLabels(fields);

  const previousTemplateStatus = template.status;
  const previousVersionStatus = version.status;
  const publishedAt = new Date();
  const fieldCount = fields.length;

  await db.$transaction(async (tx) => {
    await tx.contractTemplate.update({
      where: { id: template.id },
      data: { status: TemplateStatus.PUBLISHED },
    });

    await tx.contractTemplateVersion.update({
      where: { id: version.id },
      data: {
        status: TemplateVersionStatus.PUBLISHED,
        publishedAt,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: AUDIT_ACTIONS.TEMPLATE_PUBLISHED,
        entityType: "ContractTemplate",
        entityId: template.id,
        metadata: {
          versionId: version.id,
          version: version.version,
          publishedAt: publishedAt.toISOString(),
          fieldCount,
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
    templateStatus: TemplateStatus.PUBLISHED,
    versionStatus: TemplateVersionStatus.PUBLISHED,
    publishedAt,
    fieldCount,
  };
}
