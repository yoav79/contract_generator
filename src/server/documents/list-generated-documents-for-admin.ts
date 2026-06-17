import { GeneratedDocumentStatus } from "@prisma/client";

import { db } from "@/lib/db";

const LIST_LIMIT = 50;

export type GeneratedDocumentListItem = {
  id: string;
  templateName: string;
  templateVersion: number;
  generatedByLabel: string;
  status: GeneratedDocumentStatus;
  pdfAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

function resolveGeneratedByLabel(name: string | null, email: string): string {
  const trimmedName = name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  return email;
}

export async function listGeneratedDocumentsForAdmin(): Promise<
  GeneratedDocumentListItem[]
> {
  const documents = await db.generatedDocument.findMany({
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
    include: {
      version: {
        include: {
          template: true,
        },
      },
      generatedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return documents.map((document) => ({
    id: document.id,
    templateName: document.version.template.name,
    templateVersion: document.version.version,
    generatedByLabel: resolveGeneratedByLabel(
      document.generatedBy.name,
      document.generatedBy.email,
    ),
    status: document.status,
    pdfAvailable: document.pdfPath !== null,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  }));
}
