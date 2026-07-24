import { UserRole } from '@prisma/client';
import prisma from '../lib/prisma';

/** IDs de formatos que el usuario puede diligenciar. Admin ve todos (null = sin filtro). */
export async function getAllowedFormatIds(userId: string, role: UserRole): Promise<string[] | null> {
  if (role === UserRole.ADMIN) return null;
  if (role !== UserRole.OPERARIO) return [];

  const rows = await prisma.userFormatAccess.findMany({
    where: { userId },
    select: { formatId: true },
  });
  return rows.map((r) => r.formatId);
}

export async function assertOperatorCanAccessFormat(
  userId: string,
  role: UserRole,
  formatId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (role === UserRole.ADMIN) return { ok: true };
  if (role !== UserRole.OPERARIO) {
    return { ok: false, error: 'No tiene permisos para esta acción' };
  }

  const access = await prisma.userFormatAccess.findUnique({
    where: { userId_formatId: { userId, formatId } },
  });
  if (!access) {
    return { ok: false, error: 'No tiene acceso a este formato' };
  }
  return { ok: true };
}
