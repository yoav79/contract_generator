import {
  TemplateFieldType,
  TemplateStatus,
  TemplateVersionStatus,
} from "@prisma/client";

import { db } from "@/lib/db";

export type PublishedTemplateFieldForGeneration = {
  key: string;
  label: string;
  fieldType: TemplateFieldType;
  required: boolean;
  displayOrder: number;
};

export type PublishedTemplateForGeneration = {
  templateId: string;
  templateName: string;
  versionId: string;
  version: number;
  docxPath: string;
  fields: PublishedTemplateFieldForGeneration[];
};

/**
 * Obtiene un template publicado con metadatos internos para generación DOCX.
 *
 * Uso exclusivo en servidor: expone `docxPath` relativo para lectura privada
 * posterior. No debe importarse en componentes cliente.
 *
 * Patrón de errores:
 * - `templateId` vacío → lanza Error (entrada inválida del llamador).
 * - Template inexistente, no PUBLISHED, sin versión PUBLISHED o sin `docxPath`
 *   → devuelve `null`.
 */
export async function getPublishedTemplateForGeneration(
  templateId: string,
): Promise<PublishedTemplateForGeneration | null> {
  const trimmedTemplateId = templateId.trim();

  if (!trimmedTemplateId) {
    throw new Error("El template es requerido.");
  }

  const template = await db.contractTemplate.findFirst({
    where: {
      id: trimmedTemplateId,
      status: TemplateStatus.PUBLISHED,
    },
    include: {
      versions: {
        where: { status: TemplateVersionStatus.PUBLISHED },
        orderBy: { version: "desc" },
        take: 1,
        include: {
          fields: {
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!template) {
    return null;
  }

  const version = template.versions[0];

  if (!version) {
    return null;
  }

  if (!version.docxPath) {
    return null;
  }

  return {
    templateId: template.id,
    templateName: template.name,
    versionId: version.id,
    version: version.version,
    docxPath: version.docxPath,
    fields: version.fields.map((field) => ({
      key: field.key,
      label: field.label,
      fieldType: field.fieldType,
      required: field.required,
      displayOrder: field.displayOrder,
    })),
  };
}
