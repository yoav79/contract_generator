import { convertToPdf } from "./convert-to-pdf";

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
 * Implementación pendiente: el render DOCX puro vive en render-docx.ts;
 * la orquestación completa se implementará en fases posteriores.
 */
export async function generateDocument(
  input: GenerateDocumentInput,
): Promise<GenerateDocumentResult> {
  void convertToPdf;
  void input;
  throw new Error("generateDocument no está implementado.");
}
