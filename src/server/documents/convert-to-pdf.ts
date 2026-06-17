export type ConvertToPdfInput = {
  sourceDocxPath: string;
  outputPdfPath: string;
};

/**
 * Convierte un DOCX a PDF.
 * Implementación pendiente: el motor de conversión se definirá en una fase posterior.
 */
export async function convertToPdf(input: ConvertToPdfInput): Promise<void> {
  void input;
  throw new Error("convertToPdf no está implementado.");
}
