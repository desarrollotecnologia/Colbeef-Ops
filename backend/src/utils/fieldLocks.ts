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
 * Fusiona datos de hoja entre dueño y colaboradores.
 * Cualquiera del equipo puede sobrescribir; el lock registra el último editor (trazabilidad).
 */
export async function mergeSheetDataWithLocks(params: {
  submissionId: string;
  sheetId: string;
  userId: string;
  existingData: Record<string, unknown>;
  incomingData: Record<string, unknown>;
}): Promise<
  | {
      ok: true;
      merged: Record<string, unknown>;
      changedFieldKeys: string[];
    }
  | { ok: false; error: string; conflicts: { fieldKey: string; filledByName: string }[] }
> {
  const { submissionId, sheetId, userId, existingData, incomingData } = params;

  const locks = await prisma.submissionFieldLock.findMany({
    where: { submissionId, sheetId },
  });
  const lockByKey = new Map(locks.map((l) => [l.fieldKey, l]));

  const merged: Record<string, unknown> = { ...existingData };
  const changedFieldKeys: string[] = [];
  const lockUpserts: { fieldKey: string; action: 'upsert' | 'delete' }[] = [];

  const allKeys = new Set([...Object.keys(existingData), ...Object.keys(incomingData)]);

  for (const key of allKeys) {
    if (!(key in incomingData)) {
      continue;
    }

    const incoming = incomingData[key];
    const existing = existingData[key];
    const lock = lockByKey.get(key);
    const changed = !valuesEqual(incoming, existing);

    merged[key] = incoming;

    if (changed) {
      changedFieldKeys.push(key);
    }

    if (isFieldValueEmpty(incoming)) {
      if (lock) {
        lockUpserts.push({ fieldKey: key, action: 'delete' });
      }
    } else if (changed || !lock || lock.filledById !== userId) {
      // Actualiza autor al guardar valor no vacío (incluye reasignación al sobrescribir)
      lockUpserts.push({ fieldKey: key, action: 'upsert' });
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const item of lockUpserts) {
      if (item.action === 'delete') {
        await tx.submissionFieldLock.deleteMany({
          where: { submissionId, sheetId, fieldKey: item.fieldKey },
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

  return { ok: true, merged, changedFieldKeys };
}
