import path from "node:path";

const STORAGE_DIR_NAME = "storage";
const TEMPLATES_DIR_NAME = "templates";
const TEMP_DIR_NAME = "temp";
const GENERATED_DIR_NAME = "generated";

export function getStorageRootAbsolutePath(): string {
  return path.join(process.cwd(), STORAGE_DIR_NAME);
}

export function getTemplatesAbsolutePath(): string {
  return path.join(getStorageRootAbsolutePath(), TEMPLATES_DIR_NAME);
}

export function getTempAbsolutePath(): string {
  return path.join(getStorageRootAbsolutePath(), TEMP_DIR_NAME);
}

export function getGeneratedAbsolutePath(): string {
  return path.join(getStorageRootAbsolutePath(), GENERATED_DIR_NAME);
}

export function toRelativeStoragePath(absolutePath: string): string {
  const storageRoot = path.resolve(getStorageRootAbsolutePath());
  const resolvedAbsolute = path.resolve(absolutePath);

  if (
    resolvedAbsolute !== storageRoot &&
    !resolvedAbsolute.startsWith(`${storageRoot}${path.sep}`)
  ) {
    throw new Error("La ruta no pertenece al directorio de storage.");
  }

  const relativeToProject = path.relative(process.cwd(), resolvedAbsolute);

  return relativeToProject.split(path.sep).join("/");
}

export function resolveRelativeStoragePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/");

  if (path.isAbsolute(normalized)) {
    throw new Error("La ruta de storage debe ser relativa.");
  }

  if (!normalized.startsWith(`${STORAGE_DIR_NAME}/`)) {
    throw new Error('La ruta de storage debe comenzar con "storage/".');
  }

  const absolutePath = path.resolve(process.cwd(), normalized);
  const storageRoot = path.resolve(getStorageRootAbsolutePath());

  if (
    absolutePath !== storageRoot &&
    !absolutePath.startsWith(`${storageRoot}${path.sep}`)
  ) {
    throw new Error("La ruta relativa escapa del directorio de storage.");
  }

  return absolutePath;
}
