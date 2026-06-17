"use server";

import { TemplateFieldType } from "@prisma/client";

import { isAdminStaff } from "@/lib/auth/authorization";
import { validateTemplateFormData } from "@/lib/forms/validate-template-form-data";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";
import { generateContractDocument } from "@/server/documents/generate-contract-document";
import { getPublishedTemplateForForm } from "@/server/templates/get-published-template-for-form";

export type ContractFormActionState =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message?: string;
      formError?: string;
      fieldErrors?: Record<string, string>;
    };

export type GenerateContractDocumentActionState =
  | {
      success: true;
      message: string;
      generatedDocumentId: string;
    }
  | {
      success: false;
      message?: string;
      formError?: string;
      fieldErrors?: Record<string, string>;
    };

const INVALID_SESSION_MESSAGE = "Sesión inválida. Inicia sesión nuevamente.";
const UNAUTHORIZED_VALIDATE_MESSAGE = "No autorizado para validar formularios.";
const UNAUTHORIZED_GENERATE_MESSAGE = "No autorizado para generar documentos.";
const MISSING_TEMPLATE_ID_MESSAGE = "El template es requerido.";
const TEMPLATE_UNAVAILABLE_MESSAGE =
  "El template ya no está disponible para generación.";
const SUCCESS_VALIDATE_MESSAGE =
  "Los datos del formulario son válidos. La generación del documento se implementará en una fase posterior.";
const SUCCESS_GENERATE_MESSAGE =
  "Documento generado correctamente. La conversión a PDF y descarga se implementarán en una fase posterior.";
const GENERIC_VALIDATE_ERROR_MESSAGE =
  "No se pudieron validar los datos. Verifica el formulario e intenta de nuevo.";
const GENERIC_GENERATE_ERROR_MESSAGE =
  "No se pudo generar el documento. Verifica el formulario e intenta de nuevo.";

function formDataToRawData(
  formData: FormData,
  fields: Array<{ key: string; fieldType: TemplateFieldType }>,
): Record<string, unknown> {
  const rawData: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.fieldType === TemplateFieldType.BOOLEAN) {
      const values = formData.getAll(field.key);
      rawData[field.key] = values.some(
        (value) => value === "true" || value === "on" || value === "1",
      );
      continue;
    }

    const value = formData.get(field.key);

    if (value !== null) {
      rawData[field.key] = value;
    }
  }

  return rawData;
}

function formDataToContractFormData(
  formData: FormData,
  fields: Array<{ key: string; fieldType: TemplateFieldType }>,
): Record<string, string | number | boolean | null> {
  const rawData = formDataToRawData(formData, fields);

  return rawData as Record<string, string | number | boolean | null>;
}

export async function validateContractFormAction(
  _prevState: ContractFormActionState | undefined,
  formData: FormData,
): Promise<ContractFormActionState> {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    return { success: false, message: INVALID_SESSION_MESSAGE };
  }

  if (!isAdminStaff(session.role)) {
    return { success: false, message: UNAUTHORIZED_VALIDATE_MESSAGE };
  }

  const templateId = String(formData.get("templateId") ?? "").trim();

  if (!templateId) {
    return { success: false, message: MISSING_TEMPLATE_ID_MESSAGE };
  }

  try {
    const template = await getPublishedTemplateForForm(templateId);

    if (!template) {
      return { success: false, message: TEMPLATE_UNAVAILABLE_MESSAGE };
    }

    const rawData = formDataToRawData(formData, template.fields);
    const validation = validateTemplateFormData(template.fields, rawData);

    if (!validation.success) {
      return {
        success: false,
        fieldErrors: validation.fieldErrors,
        formError: validation.formError,
      };
    }

    return {
      success: true,
      message: SUCCESS_VALIDATE_MESSAGE,
    };
  } catch {
    return { success: false, message: GENERIC_VALIDATE_ERROR_MESSAGE };
  }
}

export async function generateContractDocumentAction(
  _prevState: GenerateContractDocumentActionState | undefined,
  formData: FormData,
): Promise<GenerateContractDocumentActionState> {
  const session = await getSession();

  if (!isAuthenticatedSession(session)) {
    return { success: false, message: INVALID_SESSION_MESSAGE };
  }

  if (!isAdminStaff(session.role)) {
    return { success: false, message: UNAUTHORIZED_GENERATE_MESSAGE };
  }

  const templateId = String(formData.get("templateId") ?? "").trim();

  if (!templateId) {
    return { success: false, message: MISSING_TEMPLATE_ID_MESSAGE };
  }

  try {
    const template = await getPublishedTemplateForForm(templateId);

    if (!template) {
      return { success: false, message: TEMPLATE_UNAVAILABLE_MESSAGE };
    }

    const contractFormData = formDataToContractFormData(formData, template.fields);
    const validation = validateTemplateFormData(
      template.fields,
      contractFormData,
    );

    if (!validation.success) {
      return {
        success: false,
        fieldErrors: validation.fieldErrors,
        formError: validation.formError,
      };
    }

    const result = await generateContractDocument({
      userId: session.userId,
      userRole: session.role,
      templateId,
      formData: contractFormData,
    });

    return {
      success: true,
      message: SUCCESS_GENERATE_MESSAGE,
      generatedDocumentId: result.generatedDocumentId,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === TEMPLATE_UNAVAILABLE_MESSAGE) {
        return { success: false, message: TEMPLATE_UNAVAILABLE_MESSAGE };
      }

      if (
        error.message === "Los datos del formulario no son válidos." ||
        error.message === "No se pudo generar el documento."
      ) {
        return { success: false, message: error.message };
      }
    }

    return { success: false, message: GENERIC_GENERATE_ERROR_MESSAGE };
  }
}
