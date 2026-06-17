import {
  Prisma,
  TemplateFieldType,
  TemplateVersionStatus,
  UserRole,
} from "@prisma/client";

import { isLawyer } from "@/lib/auth/authorization";
import { AUDIT_ACTIONS } from "@/lib/audit/log";
import { db } from "@/lib/db";
import { readStoredDocx } from "@/lib/storage/docx";
import { extractPlaceholdersFromDocxBuffer } from "@/server/documents/extract-placeholders";

export type ExtractTemplateFieldsParams = {
  userId: string;
  userRole: UserRole;
  templateId: string;
};

export type ExtractTemplateFieldsResult = {
  templateId: string;
  versionId: string;
  version: number;
  validCount: number;
  invalidCount: number;
  createdKeys: string[];
  preservedKeys: string[];
  removedKeys: string[];
  processedXmlFiles: string[];
  warnings: string[];
};

function keyToDefaultLabel(key: string): string {
  return key
    .split("_")
    .map((segment) =>
      segment.length > 0
        ? `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`
        : segment,
    )
    .join(" ");
}

export async function extractTemplateFields(
  params: ExtractTemplateFieldsParams,
): Promise<ExtractTemplateFieldsResult> {
  const { userId, userRole, templateId } = params;

  if (!isLawyer(userRole)) {
    throw new Error("No autorizado: solo abogados pueden extraer placeholders.");
  }

  const template = await db.contractTemplate.findUnique({
    where: { id: templateId },
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

  const version = template.versions[0];

  if (!version) {
    throw new Error("No se encontró una versión del template.");
  }

  if (version.status !== TemplateVersionStatus.DRAFT) {
    throw new Error("Solo se pueden extraer placeholders de versiones en borrador.");
  }

  if (!version.docxPath) {
    throw new Error("La versión no tiene un archivo DOCX asociado.");
  }

  const buffer = await readStoredDocx(version.docxPath);
  const extraction = extractPlaceholdersFromDocxBuffer(buffer);

  const extractedKeys = new Set(
    extraction.placeholders.map((placeholder) => placeholder.key),
  );
  const existingFieldsByKey = new Map(
    version.fields.map((field) => [field.key, field]),
  );

  const createdKeys: string[] = [];
  const preservedKeys: string[] = [];
  const removedKeys: string[] = [];

  for (const placeholder of extraction.placeholders) {
    if (existingFieldsByKey.has(placeholder.key)) {
      preservedKeys.push(placeholder.key);
    } else {
      createdKeys.push(placeholder.key);
    }
  }

  for (const field of version.fields) {
    if (!extractedKeys.has(field.key)) {
      removedKeys.push(field.key);
    }
  }

  const invalidPlaceholders = extraction.invalidCandidates.map((candidate) => ({
    raw: candidate.raw,
    reason: candidate.reason,
    sourceXml: candidate.sourceXml,
  }));

  await db.$transaction(async (tx) => {
    if (removedKeys.length > 0) {
      await tx.templateField.deleteMany({
        where: {
          versionId: version.id,
          key: { in: removedKeys },
        },
      });
    }

    if (createdKeys.length > 0) {
      const placeholdersToCreate = extraction.placeholders.filter((placeholder) =>
        createdKeys.includes(placeholder.key),
      );

      await tx.templateField.createMany({
        data: placeholdersToCreate.map((placeholder) => ({
          versionId: version.id,
          key: placeholder.key,
          label: keyToDefaultLabel(placeholder.key),
          fieldType: TemplateFieldType.TEXT,
          required: false,
          displayOrder: placeholder.firstSeenOrder,
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        userId,
        action: AUDIT_ACTIONS.TEMPLATE_FIELDS_EXTRACTED,
        entityType: "ContractTemplateVersion",
        entityId: version.id,
        metadata: {
          templateId: template.id,
          version: version.version,
          validCount: extraction.placeholders.length,
          invalidPlaceholders,
          createdKeys,
          preservedKeys,
          removedKeys,
          totalValidOccurrences: extraction.totalValidOccurrences,
          processedXmlFiles: extraction.processedXmlFiles,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return {
    templateId: template.id,
    versionId: version.id,
    version: version.version,
    validCount: extraction.placeholders.length,
    invalidCount: extraction.invalidCandidates.length,
    createdKeys,
    preservedKeys,
    removedKeys,
    processedXmlFiles: extraction.processedXmlFiles,
    warnings: extraction.warnings,
  };
}
