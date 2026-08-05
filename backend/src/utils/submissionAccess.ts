import { UserRole } from '@prisma/client';
import prisma from '../lib/prisma';

export type CollaborationRole = 'OWNER' | 'COLLABORATOR' | 'ADMIN' | null;

export async function getSubmissionAccess(
  submissionId: string,
  userId: string,
  role: UserRole
): Promise<{
  ok: boolean;
  role: CollaborationRole;
  operatorId?: string;
  isEditor: boolean;
  error?: string;
}> {
  if (role === UserRole.ADMIN) {
    const sub = await prisma.formSubmission.findUnique({
      where: { id: submissionId },
      select: { operatorId: true },
    });
    if (!sub) return { ok: false, role: null, isEditor: false, error: 'Envío no encontrado' };
    return { ok: true, role: 'ADMIN', operatorId: sub.operatorId, isEditor: false };
  }

  if (role !== UserRole.OPERARIO) {
    return { ok: false, role: null, isEditor: false, error: 'No tiene permisos' };
  }

  const sub = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
    select: {
      operatorId: true,
      collaborators: { where: { userId }, select: { id: true } },
    },
  });

  if (!sub) return { ok: false, role: null, isEditor: false, error: 'Envío no encontrado' };

  if (sub.operatorId === userId) {
    return { ok: true, role: 'OWNER', operatorId: sub.operatorId, isEditor: true };
  }
  if (sub.collaborators.length > 0) {
    return { ok: true, role: 'COLLABORATOR', operatorId: sub.operatorId, isEditor: true };
  }

  return { ok: false, role: null, isEditor: false, error: 'No tiene acceso a este envío' };
}

export async function assertCanEditSubmission(
  submissionId: string,
  userId: string,
  role: UserRole
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const access = await getSubmissionAccess(submissionId, userId, role);
  if (!access.ok) return { ok: false, error: access.error ?? 'Sin acceso', status: 403 };
  if (!access.isEditor) return { ok: false, error: 'No puede editar este envío', status: 403 };
  return { ok: true };
}
