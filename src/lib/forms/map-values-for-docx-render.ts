import { TemplateFieldType } from "@prisma/client";

const VALID_VALUE_KEY_REGEX = /^[a-z][a-z0-9_]*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type DocxRenderField = {
  key: string;
  fieldType: TemplateFieldType;
};

const DUPLICATE_FIELD_KEYS_MESSAGE =
  "La configuración de campos contiene claves duplicadas.";
const UNKNOWN_VALUE_KEY_MESSAGE =
  "Los datos contienen campos no permitidos para este template.";
const MISSING_FIELD_VALUE_MESSAGE =
  "Faltan valores para uno o más campos del template.";
const INVALID_FIELD_KEY_MESSAGE = "Una clave de campo no es válida.";
const INVALID_FIELD_TYPE_MESSAGE =
  "Un valor no coincide con el tipo de campo esperado.";

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

function mapBooleanValue(value: boolean): string {
  return value ? "Sí" : "No";
}

function mapFieldValue(
  field: DocxRenderField,
  rawValue: string | number | boolean | null | undefined,
): string {
  switch (field.fieldType) {
    case TemplateFieldType.TEXT: {
      if (rawValue === null || rawValue === undefined) {
        return "";
      }

      if (typeof rawValue !== "string") {
        throw new Error(INVALID_FIELD_TYPE_MESSAGE);
      }

      return rawValue;
    }

    case TemplateFieldType.DATE: {
      if (rawValue === null || rawValue === undefined) {
        return "";
      }

      if (typeof rawValue !== "string" || !isValidIsoDateString(rawValue)) {
        throw new Error(INVALID_FIELD_TYPE_MESSAGE);
      }

      return rawValue;
    }

    case TemplateFieldType.NUMBER: {
      if (rawValue === null || rawValue === undefined) {
        return "";
      }

      if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
        throw new Error(INVALID_FIELD_TYPE_MESSAGE);
      }

      return String(rawValue);
    }

    case TemplateFieldType.BOOLEAN: {
      if (rawValue === undefined) {
        return mapBooleanValue(false);
      }

      if (typeof rawValue !== "boolean") {
        throw new Error(INVALID_FIELD_TYPE_MESSAGE);
      }

      return mapBooleanValue(rawValue);
    }

    default: {
      const exhaustiveCheck: never = field.fieldType;
      throw new Error(`Tipo de campo no soportado: ${String(exhaustiveCheck)}.`);
    }
  }
}

export function mapValuesForDocxRender(
  values: Record<string, string | number | boolean | null>,
  fields: DocxRenderField[],
): Record<string, string> {
  const seenKeys = new Set<string>();

  for (const field of fields) {
    if (!VALID_VALUE_KEY_REGEX.test(field.key)) {
      throw new Error(INVALID_FIELD_KEY_MESSAGE);
    }

    if (seenKeys.has(field.key)) {
      throw new Error(DUPLICATE_FIELD_KEYS_MESSAGE);
    }

    seenKeys.add(field.key);
  }

  const allowedKeys = seenKeys;

  for (const key of Object.keys(values)) {
    if (!VALID_VALUE_KEY_REGEX.test(key)) {
      throw new Error(INVALID_FIELD_KEY_MESSAGE);
    }

    if (!allowedKeys.has(key)) {
      throw new Error(UNKNOWN_VALUE_KEY_MESSAGE);
    }
  }

  const mapped: Record<string, string> = {};

  for (const field of fields) {
    const hasValue = Object.prototype.hasOwnProperty.call(values, field.key);

    if (!hasValue && field.fieldType !== TemplateFieldType.BOOLEAN) {
      throw new Error(MISSING_FIELD_VALUE_MESSAGE);
    }

    mapped[field.key] = mapFieldValue(
      field,
      hasValue ? values[field.key] : undefined,
    );
  }

  return mapped;
}
