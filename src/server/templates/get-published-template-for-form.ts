import {
  TemplateFieldType,
  TemplateStatus,
  TemplateVersionStatus,
} from "@prisma/client";

import { db } from "@/lib/db";

export type PublishedTemplateField = {
  key: string;
  label: string;
  fieldType: TemplateFieldType;
  required: boolean;
  displayOrder: number;
};

export type PublishedTemplateForForm = {
  id: string;
  name: string;
  description: string | null;
  version: number;
  publishedAt: string;
  fields: PublishedTemplateField[];
};

/**
 * Obtiene un template publicado listo para formulario administrativo.
 *
 * Patrón de errores:
 * - `templateId` vacío → lanza Error (entrada inválida del llamador).
 * - Template inexistente, no PUBLISHED, sin versión PUBLISHED o sin `publishedAt`
 *   → devuelve `null` (el llamador decide `notFound`, redirect, etc.).
 */
export async function getPublishedTemplateForForm(
  templateId: string,
): Promise<PublishedTemplateForForm | null> {
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

  if (!version?.publishedAt) {
    return null;
  }

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    version: version.version,
    publishedAt: version.publishedAt.toISOString(),
    fields: version.fields.map((field) => ({
      key: field.key,
      label: field.label,
      fieldType: field.fieldType,
      required: field.required,
      displayOrder: field.displayOrder,
    })),
  };
}
