import { Router, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { paramId } from '../utils/params';
import { authenticate, requireRole } from '../middleware/auth';
import { EXTRA_CHANGE_CONTROL_MODULES } from '../utils/changeControlModules';

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

type ModuleInfo = { code: string; name: string; documentCode: string | null; sheetCount: number | null };

async function listModules(): Promise<ModuleInfo[]> {
  const formats = await prisma.format.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: { code: true, name: true, documentCode: true, sheetCount: true },
  });
  return [
    ...formats,
    ...EXTRA_CHANGE_CONTROL_MODULES.map((m) => ({ ...m, sheetCount: null })),
  ];
}

const entryInclude = { updatedBy: { select: { id: true, fullName: true } } } as const;

function parseDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const s = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  return new Date(`${s}T00:00:00.000Z`);
}

function optText(value: unknown, max = 191): string | null | undefined {
  if (value === undefined) return undefined;
  const s = String(value ?? '').trim();
  return s ? s.slice(0, max) : null;
}

router.get('/', async (_req: Request, res: Response) => {
  const modules = await listModules();
  const entries = await prisma.formatChangeLog.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { formatCode: true, version: true, changeDate: true, updatedAt: true },
  });
  const byCode = new Map<string, typeof entries>();
  for (const e of entries) {
    const list = byCode.get(e.formatCode) ?? [];
    list.push(e);
    byCode.set(e.formatCode, list);
  }
  res.json(
    modules.map((m) => {
      const list = byCode.get(m.code) ?? [];
      const last = list[list.length - 1];
      return {
        ...m,
        entryCount: list.length,
        currentVersion: last?.version ?? null,
        lastChangeDate: last?.changeDate ?? null,
        lastUpdatedAt: list.reduce<Date | null>(
          (acc, e) => (!acc || e.updatedAt > acc ? e.updatedAt : acc),
          null
        ),
      };
    })
  );
});

router.get('/:code', async (req: Request, res: Response) => {
  const modules = await listModules();
  const module = modules.find((m) => m.code === paramId(req.params.code));
  if (!module) return res.status(404).json({ error: 'Formato no encontrado' });
  const entries = await prisma.formatChangeLog.findMany({
    where: { formatCode: module.code },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: entryInclude,
  });
  res.json({ module, entries });
});

router.post('/:code', async (req: Request, res: Response) => {
  const modules = await listModules();
  const module = modules.find((m) => m.code === paramId(req.params.code));
  if (!module) return res.status(404).json({ error: 'Formato no encontrado' });

  const version = optText(req.body.version, 20);
  if (!version) return res.status(400).json({ error: 'La versión es obligatoria' });
  const changeDate = parseDate(req.body.changeDate);
  if (changeDate === undefined && req.body.changeDate) {
    return res.status(400).json({ error: 'Fecha inválida (use AAAA-MM-DD)' });
  }

  const last = await prisma.formatChangeLog.findFirst({
    where: { formatCode: module.code },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });

  const entry = await prisma.formatChangeLog.create({
    data: {
      formatCode: module.code,
      version,
      changeDate: changeDate ?? null,
      elaboro: optText(req.body.elaboro) ?? null,
      reviso: optText(req.body.reviso) ?? null,
      aprobo: optText(req.body.aprobo) ?? null,
      descripcion: optText(req.body.descripcion, 5000) ?? null,
      sortOrder: (last?.sortOrder ?? 0) + 10,
      updatedById: req.user!.userId,
    },
    include: entryInclude,
  });
  res.status(201).json(entry);
});

router.patch('/entries/:id', async (req: Request, res: Response) => {
  const existing = await prisma.formatChangeLog.findUnique({ where: { id: paramId(req.params.id) } });
  if (!existing) return res.status(404).json({ error: 'Registro no encontrado' });

  const version = optText(req.body.version, 20);
  if (req.body.version !== undefined && !version) {
    return res.status(400).json({ error: 'La versión es obligatoria' });
  }
  const changeDate = parseDate(req.body.changeDate);
  if (changeDate === undefined && req.body.changeDate) {
    return res.status(400).json({ error: 'Fecha inválida (use AAAA-MM-DD)' });
  }

  const entry = await prisma.formatChangeLog.update({
    where: { id: existing.id },
    data: {
      version: version ?? undefined,
      changeDate,
      elaboro: optText(req.body.elaboro),
      reviso: optText(req.body.reviso),
      aprobo: optText(req.body.aprobo),
      descripcion: optText(req.body.descripcion, 5000),
      updatedById: req.user!.userId,
    },
    include: entryInclude,
  });
  res.json(entry);
});

router.delete('/entries/:id', async (req: Request, res: Response) => {
  const existing = await prisma.formatChangeLog.findUnique({ where: { id: paramId(req.params.id) } });
  if (!existing) return res.status(404).json({ error: 'Registro no encontrado' });
  await prisma.formatChangeLog.delete({ where: { id: existing.id } });
  res.status(204).end();
});

export default router;
