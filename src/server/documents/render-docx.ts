export type RenderDocxInput = {
  templateDocxPath: string;
  outputDocxPath: string;
  values: Record<string, string | number | boolean>;
};

/**
 * Rellena placeholders en un template DOCX y genera un DOCX intermedio.
 * Implementación pendiente.
 */
export async function renderDocx(input: RenderDocxInput): Promise<void> {
  void input;
  throw new Error("renderDocx no está implementado.");
}
