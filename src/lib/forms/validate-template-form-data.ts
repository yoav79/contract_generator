import { TemplateFieldType } from "@prisma/client";

export const MAX_TEXT_FIELD_LENGTH = 2000;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type TemplateFormField = {
  key: string;
  label: string;
  fieldType: TemplateFieldType;
  required: boolean;
};

export type ValidateTemplateFormDataSuccess = {
  success: true;
  values: Record<string, string | number | boolean | null>;
};

export type ValidateTemplateFormDataFailure = {
  success: false;
  fieldErrors: Record<string, string>;
  formError?: string;
};

export type ValidateTemplateFormDataResult =
  | ValidateTemplateFormDataSuccess
  | ValidateTemplateFormDataFailure;

function failure(
  fieldErrors: Record<string, string>,
  formError?: string,
): ValidateTemplateFormDataFailure {
  return { success: false, fieldErrors, formError };
}

function isMissingValue(value: unknown): boolean {
  return value === undefined || value === null;
}

function isEmptyOptionalValue(value: unknown): boolean {
  if (isMissingValue(value)) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  return false;
}

function isValidIsoDateString(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseBooleanValue(
  value: unknown,
): { ok: true; value: boolean } | { ok: false } {
  if (value === true || value === "true" || value === "on" || value === "1") {
    return { ok: true, value: true };
  }

  if (
    value === false ||
    value === "false" ||
    value === "off" ||
    value === "0"
  ) {
    return { ok: true, value: false };
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "on" || normalized === "1") {
      return { ok: true, value: true };
    }

    if (
      normalized === "false" ||
      normalized === "off" ||
      normalized === "0" ||
      normalized === ""
    ) {
      return { ok: true, value: false };
    }
  }

  return { ok: false };
}

function parseNumberValue(
  value: unknown,
): { ok: true; value: number } | { ok: false; reason: "empty" | "invalid" } {
  if (isEmptyOptionalValue(value)) {
    return { ok: false, reason: "empty" };
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return { ok: false, reason: "invalid" };
    }

    return { ok: true, value };
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed === "") {
      return { ok: false, reason: "empty" };
    }

    const parsed = Number(trimmed);

    if (!Number.isFinite(parsed)) {
      return { ok: false, reason: "invalid" };
    }

    return { ok: true, value: parsed };
  }

  return { ok: false, reason: "invalid" };
}

function validateTextField(
  field: TemplateFormField,
  rawValue: unknown,
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (isEmptyOptionalValue(rawValue)) {
    if (field.required) {
      return {
        ok: false,
        message: `El campo "${field.label}" es requerido.`,
      };
    }

    return { ok: true, value: null };
  }

  if (typeof rawValue !== "string") {
    return {
      ok: false,
      message: `El campo "${field.label}" debe ser texto.`,
    };
  }

  const normalized = rawValue.trim();

  if (field.required && normalized === "") {
    return {
      ok: false,
      message: `El campo "${field.label}" es requerido.`,
    };
  }

  if (normalized.length > MAX_TEXT_FIELD_LENGTH) {
    return {
      ok: false,
      message: `El campo "${field.label}" no puede superar ${MAX_TEXT_FIELD_LENGTH} caracteres.`,
    };
  }

  return { ok: true, value: normalized };
}

function validateDateField(
  field: TemplateFormField,
  rawValue: unknown,
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (isEmptyOptionalValue(rawValue)) {
    if (field.required) {
      return {
        ok: false,
        message: `El campo "${field.label}" es requerido.`,
      };
    }

    return { ok: true, value: null };
  }

  if (typeof rawValue !== "string") {
    return {
      ok: false,
      message: `El campo "${field.label}" debe ser una fecha válida (YYYY-MM-DD).`,
    };
  }

  const normalized = rawValue.trim();

  if (field.required && normalized === "") {
    return {
      ok: false,
      message: `El campo "${field.label}" es requerido.`,
    };
  }

  if (!isValidIsoDateString(normalized)) {
    return {
      ok: false,
      message: `El campo "${field.label}" debe ser una fecha válida (YYYY-MM-DD).`,
    };
  }

  return { ok: true, value: normalized };
}

function validateNumberField(
  field: TemplateFormField,
  rawValue: unknown,
): { ok: true; value: number | null } | { ok: false; message: string } {
  const parsed = parseNumberValue(rawValue);

  if (parsed.ok) {
    return { ok: true, value: parsed.value };
  }

  if (parsed.reason === "empty") {
    if (field.required) {
      return {
        ok: false,
        message: `El campo "${field.label}" es requerido.`,
      };
    }

    return { ok: true, value: null };
  }

  return {
    ok: false,
    message: `El campo "${field.label}" debe ser un número válido.`,
  };
}

function validateBooleanField(
  field: TemplateFormField,
  rawValue: unknown,
  isMissing: boolean,
): { ok: true; value: boolean } | { ok: false; message: string } {
  void field;

  if (isMissing) {
    return { ok: true, value: false };
  }

  const parsed = parseBooleanValue(rawValue);

  if (!parsed.ok) {
    return {
      ok: false,
      message: `El campo "${field.label}" debe ser verdadero o falso.`,
    };
  }

  return { ok: true, value: parsed.value };
}

export function validateTemplateFormData(
  fields: TemplateFormField[],
  rawData: Record<string, unknown>,
): ValidateTemplateFormDataResult {
  const seenKeys = new Set<string>();
  const duplicateKeys: string[] = [];

  for (const field of fields) {
    if (seenKeys.has(field.key)) {
      duplicateKeys.push(field.key);
    } else {
      seenKeys.add(field.key);
    }
  }

  if (duplicateKeys.length > 0) {
    return failure(
      {},
      "La configuración del template contiene claves de campo duplicadas.",
    );
  }

  const expectedKeys = new Set(fields.map((field) => field.key));

  for (const key of Object.keys(rawData)) {
    if (!expectedKeys.has(key)) {
      return failure(
        {},
        "El formulario contiene campos no permitidos para este template.",
      );
    }
  }

  const values: Record<string, string | number | boolean | null> = {};
  const fieldErrors: Record<string, string> = {};

  for (const field of fields) {
    const isMissing = !(field.key in rawData);
    const rawValue = rawData[field.key];

    let result:
      | { ok: true; value: string | number | boolean | null }
      | { ok: false; message: string };

    switch (field.fieldType) {
      case TemplateFieldType.TEXT:
        result = validateTextField(field, rawValue);
        break;
      case TemplateFieldType.DATE:
        result = validateDateField(field, rawValue);
        break;
      case TemplateFieldType.NUMBER:
        result = validateNumberField(field, rawValue);
        break;
      case TemplateFieldType.BOOLEAN:
        result = validateBooleanField(field, rawValue, isMissing);
        break;
      default: {
        const exhaustiveCheck: never = field.fieldType;
        return failure(
          {},
          `Tipo de campo no soportado: ${String(exhaustiveCheck)}.`,
        );
      }
    }

    if (!result.ok) {
      fieldErrors[field.key] = result.message;
      continue;
    }

    values[field.key] = result.value;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return failure(fieldErrors);
  }

  return { success: true, values };
}
