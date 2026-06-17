"use server";

import { revalidatePath } from "next/cache";

import { isLawyer } from "@/lib/auth/authorization";
import { getSession, isAuthenticatedSession } from "@/lib/auth/session";
import { createTemplateWithDocx } from "@/server/templates/create-template-with-docx";

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
const GENERIC_ERROR_MESSAGE =
  "No se pudo crear el template. Verifica los datos e intenta de nuevo.";

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
  const descriptionRaw = formData.get("description");
  const description =
    descriptionRaw === null || descriptionRaw === undefined
      ? null
      : String(descriptionRaw).trim() || null;

  const fileField = formData.get("file");

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
