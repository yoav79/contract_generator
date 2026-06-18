"use server";

import { TemplateFieldType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { isLawyer } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";
import { archiveTemplate } from "@/server/templates/archive-template";
import { createTemplateWithDocx } from "@/server/templates/create-template-with-docx";
import { extractTemplateFields } from "@/server/templates/extract-template-fields";
import { publishTemplate } from "@/server/templates/publish-template";
import { updateTemplateField } from "@/server/templates/update-template-field";

export type CreateTemplateActionState =
  | {
      success: true;
      message: string;
      templateId: string;
    }
  | {
      success: false;
      message: string;
    };

const INVALID_SESSION_MESSAGE = "Sesión inválida. Inicia sesión nuevamente.";
const UNAUTHORIZED_MESSAGE = "No autorizado para crear templates.";
const MISSING_FILE_MESSAGE = "El archivo DOCX es requerido.";
const MISSING_DESCRIPTION_MESSAGE = "La descripción es obligatoria.";
const GENERIC_ERROR_MESSAGE =
  "No se pudo crear el template. Verifica los datos e intenta de nuevo.";

export type ExtractTemplateFieldsActionState =
  | {
      success: true;
      message: string;
      templateId: string;
      validCount: number;
      invalidCount: number;
      createdCount: number;
      preservedCount: number;
      removedCount: number;
      warnings: string[];
    }
  | {
      success: false;
      message: string;
    };

const EXTRACT_UNAUTHORIZED_MESSAGE =
  "No autorizado para extraer placeholders del template.";
const EXTRACT_MISSING_TEMPLATE_ID_MESSAGE = "El template es requerido.";
const EXTRACT_GENERIC_ERROR_MESSAGE =
  "No se pudieron extraer los placeholders. Verifica el template e intenta de nuevo.";

export type UpdateTemplateFieldActionState =
  | {
      success: true;
      message: string;
      fieldId: string;
      templateId: string;
    }
  | {
      success: false;
      message: string;
    };

const UPDATE_UNAUTHORIZED_MESSAGE =
  "No autorizado para actualizar campos del template.";
const UPDATE_MISSING_FIELD_ID_MESSAGE = "El campo es requerido.";
const UPDATE_MISSING_TEMPLATE_ID_MESSAGE = "El template es requerido.";
const UPDATE_INVALID_FIELD_TYPE_MESSAGE = "El tipo de campo no es válido.";
const UPDATE_INVALID_DISPLAY_ORDER_MESSAGE =
  "El orden de visualización debe ser un entero mayor o igual a 0.";
const UPDATE_GENERIC_ERROR_MESSAGE =
  "No se pudo actualizar el campo. Verifica los datos e intenta de nuevo.";

export type PublishTemplateActionState =
  | {
      success: true;
      message: string;
      templateId: string;
      templateStatus: string;
      versionStatus: string;
      publishedAt: string;
    }
  | {
      success: false;
      message: string;
    };

const PUBLISH_UNAUTHORIZED_MESSAGE =
  "No autorizado para publicar templates.";
const PUBLISH_MISSING_TEMPLATE_ID_MESSAGE = "El template es requerido.";
const PUBLISH_GENERIC_ERROR_MESSAGE =
  "No se pudo publicar el template. Verifica que cumpla los requisitos e intenta de nuevo.";

export type ArchiveTemplateActionState =
  | {
      success: true;
      message: string;
      templateId: string;
      templateStatus: string;
      versionStatus: string;
    }
  | {
      success: false;
      message: string;
    };

const ARCHIVE_UNAUTHORIZED_MESSAGE =
  "No autorizado para archivar templates.";
const ARCHIVE_MISSING_TEMPLATE_ID_MESSAGE = "El template es requerido.";
const ARCHIVE_GENERIC_ERROR_MESSAGE =
  "No se pudo archivar el template. Verifica el estado e intenta de nuevo.";

const VALID_FIELD_TYPES = new Set<string>(Object.values(TemplateFieldType));

function parseRequired(value: FormDataEntryValue | null): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  const normalized = String(value).trim().toLowerCase();

  return normalized === "true" || normalized === "on" || normalized === "1";
}

export async function updateTemplateFieldAction(
  _prevState: UpdateTemplateFieldActionState | undefined,
  formData: FormData,
): Promise<UpdateTemplateFieldActionState> {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    return { success: false, message: INVALID_SESSION_MESSAGE };
  }

  if (!isLawyer(session.role)) {
    return { success: false, message: UPDATE_UNAUTHORIZED_MESSAGE };
  }

  const fieldId = String(formData.get("fieldId") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const fieldTypeRaw = String(formData.get("fieldType") ?? "").trim();
  const required = parseRequired(formData.get("required"));
  const displayOrderRaw = String(formData.get("displayOrder") ?? "").trim();
  const displayOrder = Number(displayOrderRaw);

  if (!fieldId) {
    return { success: false, message: UPDATE_MISSING_FIELD_ID_MESSAGE };
  }

  if (!templateId) {
    return { success: false, message: UPDATE_MISSING_TEMPLATE_ID_MESSAGE };
  }

  if (!VALID_FIELD_TYPES.has(fieldTypeRaw)) {
    return { success: false, message: UPDATE_INVALID_FIELD_TYPE_MESSAGE };
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    return { success: false, message: UPDATE_INVALID_DISPLAY_ORDER_MESSAGE };
  }

  try {
    const result = await updateTemplateField({
      userId: session.userId,
      userRole: session.role,
      fieldId,
      label,
      fieldType: fieldTypeRaw as TemplateFieldType,
      required,
      displayOrder,
    });

    revalidatePath("/lawyer/templates");
    revalidatePath(`/lawyer/templates/${templateId}`);

    return {
      success: true,
      message: "Campo actualizado correctamente.",
      fieldId: result.fieldId,
      templateId: result.templateId,
    };
  } catch {
    return { success: false, message: UPDATE_GENERIC_ERROR_MESSAGE };
  }
}

export async function extractTemplateFieldsAction(
  _prevState: ExtractTemplateFieldsActionState | undefined,
  formData: FormData,
): Promise<ExtractTemplateFieldsActionState> {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    return { success: false, message: INVALID_SESSION_MESSAGE };
  }

  if (!isLawyer(session.role)) {
    return { success: false, message: EXTRACT_UNAUTHORIZED_MESSAGE };
  }

  const templateId = String(formData.get("templateId") ?? "").trim();

  if (!templateId) {
    return { success: false, message: EXTRACT_MISSING_TEMPLATE_ID_MESSAGE };
  }

  try {
    const result = await extractTemplateFields({
      userId: session.userId,
      userRole: session.role,
      templateId,
    });

    revalidatePath("/lawyer/templates");
    revalidatePath(`/lawyer/templates/${templateId}`);

    return {
      success: true,
      message: "Placeholders extraídos correctamente.",
      templateId: result.templateId,
      validCount: result.validCount,
      invalidCount: result.invalidCount,
      createdCount: result.createdKeys.length,
      preservedCount: result.preservedKeys.length,
      removedCount: result.removedKeys.length,
      warnings: result.warnings,
    };
  } catch {
    return { success: false, message: EXTRACT_GENERIC_ERROR_MESSAGE };
  }
}

export async function createTemplateAction(
  _prevState: CreateTemplateActionState | undefined,
  formData: FormData,
): Promise<CreateTemplateActionState> {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    return { success: false, message: INVALID_SESSION_MESSAGE };
  }

  if (!isLawyer(session.role)) {
    return { success: false, message: UNAUTHORIZED_MESSAGE };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const fileField = formData.get("file");

  if (!description) {
    return { success: false, message: MISSING_DESCRIPTION_MESSAGE };
  }

  if (!(fileField instanceof File) || fileField.size === 0) {
    return { success: false, message: MISSING_FILE_MESSAGE };
  }

  try {
    const result = await createTemplateWithDocx({
      userId: session.userId,
      userRole: session.role,
      name,
      description,
      file: fileField,
    });

    revalidatePath("/lawyer/templates");

    return {
      success: true,
      message: "Template creado correctamente.",
      templateId: result.templateId,
    };
  } catch {
    return { success: false, message: GENERIC_ERROR_MESSAGE };
  }
}

export async function publishTemplateAction(
  _prevState: PublishTemplateActionState | undefined,
  formData: FormData,
): Promise<PublishTemplateActionState> {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    return { success: false, message: INVALID_SESSION_MESSAGE };
  }

  if (!isLawyer(session.role)) {
    return { success: false, message: PUBLISH_UNAUTHORIZED_MESSAGE };
  }

  const templateId = String(formData.get("templateId") ?? "").trim();

  if (!templateId) {
    return { success: false, message: PUBLISH_MISSING_TEMPLATE_ID_MESSAGE };
  }

  try {
    const result = await publishTemplate({
      userId: session.userId,
      userRole: session.role,
      templateId,
    });

    revalidatePath("/lawyer/templates");
    revalidatePath(`/lawyer/templates/${templateId}`);

    return {
      success: true,
      message: "Template publicado correctamente.",
      templateId: result.templateId,
      templateStatus: result.templateStatus,
      versionStatus: result.versionStatus,
      publishedAt: result.publishedAt.toISOString(),
    };
  } catch {
    return { success: false, message: PUBLISH_GENERIC_ERROR_MESSAGE };
  }
}

export async function archiveTemplateAction(
  _prevState: ArchiveTemplateActionState | undefined,
  formData: FormData,
): Promise<ArchiveTemplateActionState> {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    return { success: false, message: INVALID_SESSION_MESSAGE };
  }

  if (!isLawyer(session.role)) {
    return { success: false, message: ARCHIVE_UNAUTHORIZED_MESSAGE };
  }

  const templateId = String(formData.get("templateId") ?? "").trim();

  if (!templateId) {
    return { success: false, message: ARCHIVE_MISSING_TEMPLATE_ID_MESSAGE };
  }

  try {
    const result = await archiveTemplate({
      userId: session.userId,
      userRole: session.role,
      templateId,
    });

    revalidatePath("/lawyer/templates");
    revalidatePath(`/lawyer/templates/${templateId}`);

    return {
      success: true,
      message: "Template archivado correctamente.",
      templateId: result.templateId,
      templateStatus: result.templateStatus,
      versionStatus: result.versionStatus,
    };
  } catch {
    return { success: false, message: ARCHIVE_GENERIC_ERROR_MESSAGE };
  }
}
