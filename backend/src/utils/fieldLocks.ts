import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';

export function isFieldValueEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) {
    return true;
  }
  return false;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export type FieldLockInfo = {
  sheetId: string;
  fieldKey: string;
  filledById: string;
  filledByName?: string;
};

/**
 * Fusiona datos de hoja respetando locks: solo el autor puede cambiar su campo;
 * campos vacíos los puede tomar cualquier editor.
 */
export async function mergeSheetDataWithLocks(params: {
  submissionId: string;
  sheetId: string;
  userId: string;
  existingData: Record<string, unknown>;
  incomingData: Record<string, unknown>;
}): Promise<
  | { ok: true; merged: Record<string, unknown> }
  | { ok: false; error: string; conflicts: { fieldKey: string; filledByName: string }[] }
> {
  const { submissionId, sheetId, userId, existingData, incomingData } = params;

  const locks = await prisma.submissionFieldLock.findMany({
    where: { submissionId, sheetId },
    include: { filledBy: { select: { id: true, fullName: true } } },
  });
  const lockByKey = new Map(locks.map((l) => [l.fieldKey, l]));

  const merged: Record<string, unknown> = { ...existingData };
  const conflicts: { fieldKey: string; filledByName: string }[] = [];
  const lockUpserts: { fieldKey: string; action: 'upsert' | 'delete' }[] = [];

  const allKeys = new Set([...Object.keys(existingData), ...Object.keys(incomingData)]);

  for (const key of allKeys) {
    const incoming = incomingData[key];
    const existing = existingData[key];
    const lock = lockByKey.get(key);

    // Cliente no envió la clave → conservar
    if (!(key in incomingData)) {
      continue;
    }

    if (lock && lock.filledById !== userId) {
      if (!valuesEqual(incoming, existing)) {
        conflicts.push({
          fieldKey: key,
          filledByName: lock.filledBy.fullName,
        });
      }
      continue;
    }

    merged[key] = incoming;

    if (isFieldValueEmpty(incoming)) {
      if (lock && lock.filledById === userId) {
        lockUpserts.push({ fieldKey: key, action: 'delete' });
      }
    } else if (!lock || lock.filledById === userId) {
      lockUpserts.push({ fieldKey: key, action: 'upsert' });
    }
  }

  if (conflicts.length > 0) {
    return {
      ok: false,
      error: `No puede modificar campos llenados por otros: ${conflicts
        .map((c) => `${c.fieldKey} (${c.filledByName})`)
        .join(', ')}`,
      conflicts,
    };
  }

  await prisma.$transaction(async (tx) => {
    for (const item of lockUpserts) {
      if (item.action === 'delete') {
        await tx.submissionFieldLock.deleteMany({
          where: { submissionId, sheetId, fieldKey: item.fieldKey, filledById: userId },
        });
      } else {
        await tx.submissionFieldLock.upsert({
          where: {
            submissionId_sheetId_fieldKey: { submissionId, sheetId, fieldKey: item.fieldKey },
          },
          create: {
            id: randomUUID(),
            submissionId,
            sheetId,
            fieldKey: item.fieldKey,
            filledById: userId,
          },
          update: {
            filledById: userId,
            filledAt: new Date(),
          },
        });
      }
    }
  });

  return { ok: true, merged };
}
