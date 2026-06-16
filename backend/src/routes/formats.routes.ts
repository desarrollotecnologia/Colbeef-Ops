import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, denyPanel } from '../middleware/auth';
import { paramId } from '../utils/params';

const router = Router();

router.get('/', authenticate, denyPanel, async (_req: Request, res: Response) => {
  const formats = await prisma.format.findMany({
    where: { active: true },
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
  const format = await prisma.format.findUnique({
    where: { id: paramId(req.params.id) },
    include: {
      sheets: {
        orderBy: { sheetOrder: 'asc' },
        include: {
          fields: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });

  if (!format) {
    return res.status(404).json({ error: 'Formato no encontrado' });
  }

  res.json(format);
});

export default router;
