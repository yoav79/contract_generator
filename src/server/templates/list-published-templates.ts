import { TemplateStatus, TemplateVersionStatus } from "@prisma/client";

import { db } from "@/lib/db";

export type PublishedTemplateListItem = {
  id: string;
  name: string;
  description: string | null;
  version: number;
  publishedAt: string;
  fieldCount: number;
};

export async function listPublishedTemplates(): Promise<
  PublishedTemplateListItem[]
> {
  const templates = await db.contractTemplate.findMany({
    where: {
      status: TemplateStatus.PUBLISHED,
      versions: {
        some: { status: TemplateVersionStatus.PUBLISHED },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      versions: {
        where: { status: TemplateVersionStatus.PUBLISHED },
        orderBy: { version: "desc" },
        take: 1,
        include: {
          _count: {
            select: { fields: true },
          },
        },
      },
    },
  });

  const items: PublishedTemplateListItem[] = [];

  for (const template of templates) {
    const version = template.versions[0];

    if (!version?.publishedAt) {
      continue;
    }

    items.push({
      id: template.id,
      name: template.name,
      description: template.description,
      version: version.version,
      publishedAt: version.publishedAt.toISOString(),
      fieldCount: version._count.fields,
    });
  }

  return items;
}
