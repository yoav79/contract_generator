export type PlaceholderDefinition = {
  key: string;
  occurrences: number;
};

/**
 * Extrae placeholders de un archivo DOCX.
 * Implementación pendiente: se conectará con la librería documental elegida.
 */
export async function extractPlaceholders(
  docxPath: string,
): Promise<PlaceholderDefinition[]> {
  void docxPath;
  throw new Error("extractPlaceholders no está implementado.");
}
