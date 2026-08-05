import { Prisma, SubmissionActivityType } from '@prisma/client';
import prisma from '../lib/prisma';

export async function logSubmissionActivity(params: {
  submissionId: string;
  type: SubmissionActivityType;
  actorId?: string | null;
  targetUserId?: string | null;
  notes?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.submissionActivity.create({
    data: {
      submissionId: params.submissionId,
      type: params.type,
      actorId: params.actorId ?? undefined,
      targetUserId: params.targetUserId ?? undefined,
      notes: params.notes ?? undefined,
      metadata: params.metadata,
    },
  });
}
