import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const AUDIT_ACTIONS = {
  TEMPLATE_CREATED: "TEMPLATE_CREATED",
  TEMPLATE_VERSION_CREATED: "TEMPLATE_VERSION_CREATED",
  TEMPLATE_UPLOAD_STORED: "TEMPLATE_UPLOAD_STORED",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export type CreateAuditLogParams = {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
};

export async function createAuditLog(params: CreateAuditLogParams) {
  return db.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata:
        params.metadata === null || params.metadata === undefined
          ? undefined
          : (params.metadata as Prisma.InputJsonValue),
    },
  });
}
