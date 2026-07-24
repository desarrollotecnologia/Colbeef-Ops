import { Router, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticate, denyPanel } from '../middleware/auth';
import { paramId } from '../utils/params';
import { assertOperatorCanAccessFormat, getAllowedFormatIds } from '../utils/formatAccess';

const router = Router();

router.get('/', authenticate, denyPanel, async (req: Request, res: Response) => {
  const allowedIds = await getAllowedFormatIds(req.user!.userId, req.user!.role);

  const formats = await prisma.format.findMany({
    where: {
      active: true,
      ...(allowedIds !== null ? { id: { in: allowedIds.length ? allowedIds : ['__none__'] } } : {}),
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      sheets: {
        orderBy: { sheetOrder: 'asc' },
        select: { id: true, name: true, slug: true, sheetOrder: true },
      },
      _count: { select: { sheets: true } },
    },
  });
  res.json(formats);
});

router.get('/:id', authenticate, denyPanel, async (req: Request, res: Response) => {
  const formatId = paramId(req.params.id);
  const access = await assertOperatorCanAccessFormat(req.user!.userId, req.user!.role, formatId);
  if (!access.ok && req.user!.role === UserRole.OPERARIO) {
    return res.status(403).json({ error: access.error });
  }

  const format = await prisma.format.findUnique({
    where: { id: formatId },
    include: {
      sheets: {
        orderBy: { sheetOrder: 'asc' },
        include: {
          fields: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });

  if (!format || !format.active) {
    return res.status(404).json({ error: 'Formato no encontrado' });
  }

  res.json(format);
});

export default router;
