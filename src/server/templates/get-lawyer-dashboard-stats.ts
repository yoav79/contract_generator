import { TemplateStatus } from "@prisma/client";

import { db } from "@/lib/db";

export type LawyerDashboardRecentTemplate = {
  id: string;
  name: string;
  status: TemplateStatus;
  updatedAt: string;
  createdAt: string;
};

export type LawyerDashboardStats = {
  totalTemplates: number;
  draftTemplates: number;
  publishedTemplates: number;
  archivedTemplates: number;
  lastActivityAt: string | null;
  recentTemplates: LawyerDashboardRecentTemplate[];
};

export async function getLawyerDashboardStats(
  lawyerId: string,
): Promise<LawyerDashboardStats> {
  const where = { createdById: lawyerId };

  const [
    totalTemplates,
    draftTemplates,
    publishedTemplates,
    archivedTemplates,
    lastActivity,
    recentRows,
  ] = await Promise.all([
    db.contractTemplate.count({ where }),
    db.contractTemplate.count({
      where: { ...where, status: TemplateStatus.DRAFT },
    }),
    db.contractTemplate.count({
      where: { ...where, status: TemplateStatus.PUBLISHED },
    }),
    db.contractTemplate.count({
      where: { ...where, status: TemplateStatus.ARCHIVED },
    }),
    db.contractTemplate.aggregate({
      where,
      _max: { updatedAt: true },
    }),
    db.contractTemplate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    totalTemplates,
    draftTemplates,
    publishedTemplates,
    archivedTemplates,
    lastActivityAt: lastActivity._max.updatedAt?.toISOString() ?? null,
    recentTemplates: recentRows.map((template) => ({
      id: template.id,
      name: template.name,
      status: template.status,
      updatedAt: template.updatedAt.toISOString(),
      createdAt: template.createdAt.toISOString(),
    })),
  };
}
