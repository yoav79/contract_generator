import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

const VALID_VALUE_KEY_REGEX = /^[a-z][a-z0-9_]*$/;

const INVALID_TEMPLATE_BUFFER_MESSAGE =
  "El buffer del template DOCX es inválido o está vacío.";
const INVALID_VALUES_MESSAGE =
  "Los valores para renderizar el DOCX no son válidos.";
const INVALID_DOCX_MESSAGE =
  "No se pudo procesar el template DOCX. Verifica que el archivo sea válido.";
const RENDER_ERROR_MESSAGE =
  "No se pudo renderizar el DOCX con los datos proporcionados.";

export type RenderDocxInput = {
  templateDocxBuffer: Buffer;
  values: Record<string, string>;
};

export type RenderDocxResult = {
  docxBuffer: Buffer;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateValues(values: Record<string, unknown>): asserts values is Record<string, string> {
  for (const [key, value] of Object.entries(values)) {
    if (!VALID_VALUE_KEY_REGEX.test(key)) {
      throw new Error(INVALID_VALUES_MESSAGE);
    }

    if (typeof value !== "string") {
      throw new Error(INVALID_VALUES_MESSAGE);
    }
  }
}

function toSafeRenderError(error: unknown): Error {
  if (error instanceof Error) {
    const docxError = error as Error & {
      properties?: {
        errors?: Array<{ message?: string }>;
      };
    };

    const templateErrors = docxError.properties?.errors;

    if (templateErrors && templateErrors.length > 0) {
      return new Error(RENDER_ERROR_MESSAGE);
    }

    const message = error.message.toLowerCase();

    if (
      message.includes("zip") ||
      message.includes("central directory") ||
      message.includes("end of central directory") ||
      message.includes("invalid")
    ) {
      return new Error(INVALID_DOCX_MESSAGE);
    }

    return new Error(RENDER_ERROR_MESSAGE);
  }

  return new Error(RENDER_ERROR_MESSAGE);
}

export async function renderDocx(
  input: RenderDocxInput,
): Promise<RenderDocxResult> {
  const { templateDocxBuffer, values } = input;

  if (!Buffer.isBuffer(templateDocxBuffer) || templateDocxBuffer.length === 0) {
    throw new Error(INVALID_TEMPLATE_BUFFER_MESSAGE);
  }

  if (!isPlainObject(values)) {
    throw new Error(INVALID_VALUES_MESSAGE);
  }

  validateValues(values);

  try {
    const zip = new PizZip(templateDocxBuffer);
    const doc = new Docxtemplater(zip, {
      delimiters: {
        start: "{{",
        end: "}}",
      },
    });

    doc.render(values);

    const docxBuffer = doc.toBuffer();

    if (!Buffer.isBuffer(docxBuffer) || docxBuffer.length === 0) {
      throw new Error(RENDER_ERROR_MESSAGE);
    }

    return { docxBuffer };
  } catch (error) {
    throw toSafeRenderError(error);
  }
}
