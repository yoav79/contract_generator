import PizZip from "pizzip";

const VALID_PLACEHOLDER_REGEX = /\{\{([a-z][a-z0-9_]*)\}\}/g;
const BROAD_PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}/g;
const VALID_KEY_REGEX = /^[a-z][a-z0-9_]*$/;
const WT_TEXT_REGEX = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;

const DOCUMENT_XML_PATH = "word/document.xml";
const DOCX_READ_ERROR_MESSAGE =
  "No se pudo leer el DOCX para extraer placeholders.";

export type PlaceholderDefinition = {
  key: string;
  raw: string;
  occurrences: number;
  firstSeenOrder: number;
};

export type InvalidPlaceholderCandidate = {
  raw: string;
  reason: string;
  sourceXml: string;
};

export type ExtractPlaceholdersResult = {
  placeholders: PlaceholderDefinition[];
  invalidCandidates: InvalidPlaceholderCandidate[];
  totalValidOccurrences: number;
  processedXmlFiles: string[];
  warnings: string[];
};

function isProcessableXmlPath(path: string): boolean {
  return (
    path === DOCUMENT_XML_PATH ||
    /^word\/header.+\.xml$/.test(path) ||
    /^word\/footer.+\.xml$/.test(path)
  );
}

function sortXmlPaths(paths: string[]): string[] {
  const rank = (path: string): number => {
    if (path === DOCUMENT_XML_PATH) {
      return 0;
    }

    if (path.startsWith("word/header")) {
      return 1;
    }

    if (path.startsWith("word/footer")) {
      return 2;
    }

    return 3;
  };

  return [...paths].sort((left, right) => {
    const leftRank = rank(left);
    const rightRank = rank(right);

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.localeCompare(right);
  });
}

function extractTextFromOoxml(xml: string): string {
  const parts: string[] = [];

  for (const match of xml.matchAll(WT_TEXT_REGEX)) {
    parts.push(match[1] ?? "");
  }

  return parts.join("");
}

function getInvalidReason(inner: string): string {
  const trimmed = inner.trim();

  if (!trimmed) {
    return "El placeholder está vacío.";
  }

  if (/\s/.test(inner)) {
    return "No se permiten espacios.";
  }

  if (/[A-Z]/.test(inner)) {
    return "No se permiten letras mayúsculas.";
  }

  if (/-/.test(inner)) {
    return "No se permiten guiones.";
  }

  if (!/^[a-z]/.test(inner)) {
    return "Debe empezar con letra minúscula.";
  }

  if (/[^a-z0-9_]/.test(inner)) {
    return "Contiene caracteres no permitidos.";
  }

  return "Formato inválido.";
}

function listProcessableXmlFiles(zip: PizZip): string[] {
  const paths = Object.keys(zip.files).filter((path) => {
    const entry = zip.files[path];

    if (!entry || entry.dir) {
      return false;
    }

    return isProcessableXmlPath(path);
  });

  return sortXmlPaths(paths);
}

function readXmlContent(zip: PizZip, path: string): string | null {
  const entry = zip.file(path);

  if (!entry) {
    return null;
  }

  return entry.asText();
}

export function extractPlaceholdersFromDocxBuffer(
  buffer: Buffer,
): ExtractPlaceholdersResult {
  let zip: PizZip;

  try {
    zip = new PizZip(buffer);
  } catch {
    throw new Error(DOCX_READ_ERROR_MESSAGE);
  }

  const processedXmlFiles = listProcessableXmlFiles(zip);
  const warnings: string[] = [];

  if (!processedXmlFiles.includes(DOCUMENT_XML_PATH)) {
    warnings.push("No se encontró word/document.xml en el DOCX.");
  }

  if (processedXmlFiles.length === 0) {
    warnings.push("No se encontraron partes XML procesables en el DOCX.");
  }

  const placeholderByKey = new Map<string, PlaceholderDefinition>();
  const invalidCandidates: InvalidPlaceholderCandidate[] = [];
  const invalidSeen = new Set<string>();
  let totalValidOccurrences = 0;
  let firstSeenCounter = 0;

  for (const sourceXml of processedXmlFiles) {
    const xmlContent = readXmlContent(zip, sourceXml);

    if (xmlContent === null) {
      warnings.push(`No se pudo leer el contenido de ${sourceXml}.`);
      continue;
    }

    const text = extractTextFromOoxml(xmlContent);

    for (const match of text.matchAll(VALID_PLACEHOLDER_REGEX)) {
      const raw = match[0];
      const key = match[1];

      if (!key) {
        continue;
      }

      totalValidOccurrences += 1;

      const existing = placeholderByKey.get(key);

      if (existing) {
        existing.occurrences += 1;
        continue;
      }

      firstSeenCounter += 1;
      placeholderByKey.set(key, {
        key,
        raw,
        occurrences: 1,
        firstSeenOrder: firstSeenCounter,
      });
    }

    for (const match of text.matchAll(BROAD_PLACEHOLDER_REGEX)) {
      const raw = match[0];
      const inner = match[1] ?? "";

      if (VALID_KEY_REGEX.test(inner)) {
        continue;
      }

      const dedupeKey = `${sourceXml}::${raw}`;
      if (invalidSeen.has(dedupeKey)) {
        continue;
      }

      invalidSeen.add(dedupeKey);
      invalidCandidates.push({
        raw,
        reason: getInvalidReason(inner),
        sourceXml,
      });
    }
  }

  const placeholders = [...placeholderByKey.values()].sort(
    (left, right) => left.firstSeenOrder - right.firstSeenOrder,
  );

  return {
    placeholders,
    invalidCandidates,
    totalValidOccurrences,
    processedXmlFiles,
    warnings,
  };
}

/**
 * Extrae placeholders de un archivo DOCX por ruta relativa.
 * Implementación pendiente: el orquestador usará readStoredDocx + extractPlaceholdersFromDocxBuffer.
 */
export async function extractPlaceholders(
  docxPath: string,
): Promise<PlaceholderDefinition[]> {
  void docxPath;
  throw new Error("extractPlaceholders no está implementado.");
}