import {
  Prisma,
  TemplateFieldType,
  TemplateVersionStatus,
  UserRole,
} from "@prisma/client";

import { isLawyer } from "@/lib/auth/authorization";
import { AUDIT_ACTIONS } from "@/lib/audit/log";
import { db } from "@/lib/db";

const MAX_LABEL_LENGTH = 120;

const VALID_FIELD_TYPES = new Set<string>(Object.values(TemplateFieldType));

export type UpdateTemplateFieldParams = {
  userId: string;
  userRole: UserRole;
  fieldId: string;
  label: string;
  fieldType: TemplateFieldType;
  required: boolean;
  displayOrder: number;
};

export type UpdateTemplateFieldResult = {
  fieldId: string;
  key: string;
  label: string;
  fieldType: TemplateFieldType;
  required: boolean;
  displayOrder: number;
  templateId: string;
  versionId: string;
};

export async function updateTemplateField(
  params: UpdateTemplateFieldParams,
): Promise<UpdateTemplateFieldResult> {
  const { userId, userRole, fieldId, label, fieldType, required, displayOrder } =
    params;

  if (!isLawyer(userRole)) {
    throw new Error("No autorizado: solo abogados pueden actualizar campos.");
  }

  const trimmedFieldId = fieldId.trim();

  if (!trimmedFieldId) {
    throw new Error("El campo es requerido.");
  }

  const trimmedLabel = label.trim();

  if (!trimmedLabel) {
    throw new Error("El label del campo es requerido.");
  }

  if (trimmedLabel.length > MAX_LABEL_LENGTH) {
    throw new Error(
      `El label del campo no puede superar ${MAX_LABEL_LENGTH} caracteres.`,
    );
  }

  if (!VALID_FIELD_TYPES.has(fieldType)) {
    throw new Error("El tipo de campo no es válido.");
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    throw new Error("displayOrder debe ser un entero mayor o igual a 0.");
  }

  const field = await db.templateField.findUnique({
    where: { id: trimmedFieldId },
    include: {
      version: {
        include: {
          template: true,
        },
      },
    },
  });

  if (!field) {
    throw new Error("Campo no encontrado.");
  }

  if (field.version.template.createdById !== userId) {
    throw new Error("No autorizado: el template no pertenece al abogado.");
  }

  if (field.version.status !== TemplateVersionStatus.DRAFT) {
    throw new Error("Solo se pueden editar campos de versiones en borrador.");
  }

  const before = {
    label: field.label,
    fieldType: field.fieldType,
    required: field.required,
    displayOrder: field.displayOrder,
  };

  const after = {
    label: trimmedLabel,
    fieldType,
    required,
    displayOrder,
  };

  const updatedField = await db.$transaction(async (tx) => {
    const result = await tx.templateField.update({
      where: { id: field.id },
      data: after,
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: AUDIT_ACTIONS.TEMPLATE_FIELD_UPDATED,
        entityType: "TemplateField",
        entityId: field.id,
        metadata: {
          templateId: field.version.templateId,
          versionId: field.versionId,
          key: field.key,
          before,
          after,
        } as Prisma.InputJsonValue,
      },
    });

    return result;
  });

  return {
    fieldId: updatedField.id,
    key: updatedField.key,
    label: updatedField.label,
    fieldType: updatedField.fieldType,
    required: updatedField.required,
    displayOrder: updatedField.displayOrder,
    templateId: field.version.templateId,
    versionId: field.versionId,
  };
}
