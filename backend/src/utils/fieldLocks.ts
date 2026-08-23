import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { OWNED_ROW_REPEATER_LAYOUT } from './multiDayFormats';

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

type OwnedRow = Record<string, unknown> & {
  id?: string;
  ownerUserId?: string | null;
  ownerName?: string | null;
};

function isOwnedRowLayout(fieldOptions: unknown): boolean {
  if (!fieldOptions || typeof fieldOptions !== 'object') return false;
  const opts = fieldOptions as { layout?: string; ownedRows?: boolean };
  return opts.layout === OWNED_ROW_REPEATER_LAYOUT || opts.ownedRows === true;
}

function rowHasContent(row: OwnedRow): boolean {
  const keys = ['fecha', 'hora', 'desinfectante', 'concentracion_ppm', 'observaciones'];
  return keys.some((k) => {
    const v = row[k];
    return v !== undefined && v !== null && String(v).trim() !== '';
  });
}

/**
 * Fusiona filas con dueño: cada usuario solo puede crear/editar/borrar las suyas.
 * Las filas de otros se conservan desde existing.
 */
export function mergeOwnedRepeaterRows(params: {
  existing: unknown;
  incoming: unknown;
  userId: string;
  userName: string;
}):
  | { ok: true; merged: OwnedRow[]; changed: boolean }
  | { ok: false; error: string } {
  const existingRows = Array.isArray(params.existing) ? (params.existing as OwnedRow[]) : [];
  const incomingRows = Array.isArray(params.incoming) ? (params.incoming as OwnedRow[]) : [];

  const existingById = new Map<string, OwnedRow>();
  for (const row of existingRows) {
    if (row?.id) existingById.set(String(row.id), row);
  }

  const others = existingRows.filter((r) => r.ownerUserId && r.ownerUserId !== params.userId);
  const othersById = new Map(others.map((r) => [String(r.id), r]));

  const merged: OwnedRow[] = [];
  const seenOtherIds = new Set<string>();

  for (const raw of incomingRows) {
    const row = { ...raw };
    const id = row.id ? String(row.id) : undefined;
    const prev = id ? existingById.get(id) : undefined;

    if (prev?.ownerUserId && prev.ownerUserId !== params.userId) {
      merged.push(prev);
      seenOtherIds.add(String(prev.id));
      continue;
    }
    if (row.ownerUserId && row.ownerUserId !== params.userId) {
      return {
        ok: false,
        error: 'No puede editar filas de otro usuario',
      };
    }

    const claimed: OwnedRow = { ...row };
    if (!claimed.id) claimed.id = randomUUID();

    if (rowHasContent(claimed)) {
      claimed.ownerUserId = params.userId;
      claimed.ownerName = params.userName;
      claimed.responsable = params.userName;
      claimed.num_pediluvios =
        claimed.num_pediluvios === undefined ||
        claimed.num_pediluvios === null ||
        claimed.num_pediluvios === ''
          ? 2
          : claimed.num_pediluvios;
    } else {
      claimed.ownerUserId = null;
      claimed.ownerName = null;
      claimed.responsable = '';
      claimed.num_pediluvios = 2;
    }

    merged.push(claimed);
  }

  for (const [id, row] of othersById) {
    if (!seenOtherIds.has(id)) {
      merged.push(row);
    }
  }

  const changed = !valuesEqual(existingRows, merged);
  return { ok: true, merged, changed };
}

/**
 * Fusiona datos de hoja entre dueño y colaboradores.
 * Por defecto cualquiera del equipo puede sobrescribir; el lock registra el último editor.
 * Si hay repetidores con filas de dueño, fusiona fila por fila.
 */
export async function mergeSheetDataWithLocks(params: {
  submissionId: string;
  sheetId: string;
  userId: string;
  userName?: string;
  existingData: Record<string, unknown>;
  incomingData: Record<string, unknown>;
  fieldOptionsByKey?: Record<string, unknown>;
}): Promise<
  | {
      ok: true;
      merged: Record<string, unknown>;
      changedFieldKeys: string[];
    }
  | { ok: false; error: string; conflicts: { fieldKey: string; filledByName: string }[] }
> {
  const {
    submissionId,
    sheetId,
    userId,
    userName = '',
    existingData,
    incomingData,
    fieldOptionsByKey = {},
  } = params;

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

    if (isOwnedRowLayout(fieldOptionsByKey[key])) {
      const rowMerge = mergeOwnedRepeaterRows({
        existing,
        incoming,
        userId,
        userName,
      });
      if (!rowMerge.ok) {
        return { ok: false, error: rowMerge.error, conflicts: [] };
      }
      merged[key] = rowMerge.merged;
      if (rowMerge.changed) {
        changedFieldKeys.push(key);
      }
      if (rowMerge.merged.some((r) => r.ownerUserId === userId && rowHasContent(r))) {
        lockUpserts.push({ fieldKey: key, action: 'upsert' });
      } else if (lock && lock.filledById === userId && !rowMerge.merged.some(rowHasContent)) {
        lockUpserts.push({ fieldKey: key, action: 'delete' });
      }
      continue;
    }

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
