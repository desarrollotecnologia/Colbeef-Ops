import { UsageEventType, UserRole, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export type UsageEventInput = {
  eventType: UsageEventType;
  userId?: string | null;
  username?: string | null;
  userRole?: UserRole | null;
  path?: string | null;
  formatId?: string | null;
  formatCode?: string | null;
  formatName?: string | null;
  submissionId?: string | null;
  sheetId?: string | null;
  sheetName?: string | null;
  metadata?: Record<string, unknown> | null;
};

/** Registra evento de usabilidad sin bloquear la petición principal */
export function logUsageEvent(input: UsageEventInput): void {
  prisma.usageEvent
    .create({
      data: {
        eventType: input.eventType,
        userId: input.userId ?? undefined,
        username: input.username ?? undefined,
        userRole: input.userRole ?? undefined,
        path: input.path ?? undefined,
        formatId: input.formatId ?? undefined,
        formatCode: input.formatCode ?? undefined,
        formatName: input.formatName ?? undefined,
        submissionId: input.submissionId ?? undefined,
        sheetId: input.sheetId ?? undefined,
        sheetName: input.sheetName ?? undefined,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    })
    .catch((err) => {
      console.error('[usage] No se pudo registrar evento:', input.eventType, err);
    });
}
