import { convertToPdf } from "./convert-to-pdf";
import { renderDocx } from "./render-docx";

export type GenerateDocumentInput = {
  templateDocxPath: string;
  outputDocxPath: string;
  outputPdfPath: string;
  values: Record<string, string | number | boolean>;
};

export type GenerateDocumentResult = {
  docxPath: string;
  pdfPath: string;
};

/**
 * Orquesta render DOCX y conversión a PDF.
 * Implementación pendiente: hoy solo define el contrato del flujo.
 */
export async function generateDocument(
  input: GenerateDocumentInput,
): Promise<GenerateDocumentResult> {
  await renderDocx({
    templateDocxPath: input.templateDocxPath,
    outputDocxPath: input.outputDocxPath,
    values: input.values,
  });

  await convertToPdf({
    sourceDocxPath: input.outputDocxPath,
    outputPdfPath: input.outputPdfPath,
  });

  return {
    docxPath: input.outputDocxPath,
    pdfPath: input.outputPdfPath,
  };
}
