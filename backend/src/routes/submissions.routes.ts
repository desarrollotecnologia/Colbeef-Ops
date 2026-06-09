import { Router, Request, Response } from 'express';
import { SubmissionStatus, UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { paramId } from '../utils/params';
import { assertWorkDateAllowed, parseWorkDate } from '../utils/workDate';

const router = Router();

router.use(authenticate);

// Listar envíos (operario ve los suyos, admin ve todos)
router.get('/', async (req: Request, res: Response) => {
  const { status, formatId, workDate, from, to } = req.query;
  const isAdmin = req.user!.role === UserRole.ADMIN;

  const where: Record<string, unknown> = {};

  if (!isAdmin) {
    where.operatorId = req.user!.userId;
  }

  if (status) where.status = status as SubmissionStatus;
  if (formatId) where.formatId = formatId as string;

  if (workDate) {
    where.workDate = new Date(workDate as string);
  } else if (from || to) {
    where.workDate = {};
    if (from) (where.workDate as Record<string, Date>).gte = new Date(from as string);
    if (to) (where.workDate as Record<string, Date>).lte = new Date(to as string);
  }

  const submissions = await prisma.formSubmission.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      format: { select: { id: true, code: true, name: true } },
      operator: { select: { id: true, fullName: true } },
      reviewedBy: { select: { id: true, fullName: true } },
      signature: true,
      _count: { select: { sheets: true } },
    },
  });

  res.json(submissions);
});

// Pendientes de revisión (solo admin)
router.get('/pending', requireRole(UserRole.ADMIN), async (_req: Request, res: Response) => {
  const pending = await prisma.formSubmission.findMany({
    where: { status: SubmissionStatus.PENDING_REVIEW },
    orderBy: { submittedAt: 'asc' },
    include: {
      format: { select: { id: true, code: true, name: true, sheetCount: true } },
      operator: { select: { id: true, fullName: true } },
    },
  });
  res.json(pending);
});

// Crear borrador
router.post('/', requireRole(UserRole.OPERARIO), async (req: Request, res: Response) => {
  const { formatId, workDate } = req.body;

  if (!formatId || !workDate) {
    return res.status(400).json({ error: 'formatId y workDate son obligatorios' });
  }

  const format = await prisma.format.findUnique({
    where: { id: formatId },
    include: { sheets: true },
  });

  if (!format) {
    return res.status(404).json({ error: 'Formato no encontrado' });
  }

  const parsedDate = parseWorkDate(workDate);
  const dateCheck = await assertWorkDateAllowed(prisma, formatId, parsedDate);
  if (!dateCheck.ok) {
    return res.status(400).json({ error: dateCheck.error });
  }

  const submission = await prisma.formSubmission.create({
    data: {
      formatId,
      operatorId: req.user!.userId,
      workDate: parsedDate,
      sheets: {
        create: format.sheets.map((sheet) => ({
          sheetId: sheet.id,
          data: {},
        })),
      },
    },
    include: {
      format: true,
      sheets: { include: { sheet: true } },
    },
  });

  res.status(201).json(submission);
});

// Obtener envío con datos
router.get('/:id', async (req: Request, res: Response) => {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: paramId(req.params.id) },
    include: {
      format: {
        include: {
          sheets: {
            orderBy: { sheetOrder: 'asc' },
            include: { fields: { orderBy: { sortOrder: 'asc' } } },
          },
        },
      },
      operator: { select: { id: true, fullName: true } },
      reviewedBy: { select: { id: true, fullName: true } },
      sheets: { include: { sheet: true } },
      signature: true,
    },
  });

  if (!submission) {
    return res.status(404).json({ error: 'Envío no encontrado' });
  }

  const isAdmin = req.user!.role === UserRole.ADMIN;
  if (!isAdmin && submission.operatorId !== req.user!.userId) {
    return res.status(403).json({ error: 'No tiene acceso a este envío' });
  }

  res.json(submission);
});

// Guardar datos de una hoja
router.put('/:id/sheets/:sheetId', requireRole(UserRole.OPERARIO), async (req: Request, res: Response) => {
  const { data } = req.body;
  const submission = await prisma.formSubmission.findUnique({
    where: { id: paramId(req.params.id) },
  });

  if (!submission || submission.operatorId !== req.user!.userId) {
    return res.status(403).json({ error: 'No tiene acceso' });
  }

  if (submission.status !== SubmissionStatus.DRAFT && submission.status !== SubmissionStatus.REJECTED) {
    return res.status(400).json({ error: 'Este envío ya no se puede editar' });
  }

  const updated = await prisma.formSubmissionSheet.update({
    where: {
      submissionId_sheetId: {
        submissionId: paramId(req.params.id),
        sheetId: paramId(req.params.sheetId),
      },
    },
    data: { data },
  });

  res.json(updated);
});

// Entregar para revisión
router.post('/:id/submit', requireRole(UserRole.OPERARIO), async (req: Request, res: Response) => {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: paramId(req.params.id) },
    include: {
      format: {
        include: {
          sheets: {
            include: { fields: { where: { required: true } } },
          },
        },
      },
      sheets: true,
    },
  });

  if (!submission || submission.operatorId !== req.user!.userId) {
    return res.status(403).json({ error: 'No tiene acceso' });
  }

  if (submission.status !== SubmissionStatus.DRAFT && submission.status !== SubmissionStatus.REJECTED) {
    return res.status(400).json({ error: 'Este envío ya fue entregado' });
  }

  const missingFields: { sheet: string; field: string; label: string }[] = [];

  for (const formatSheet of submission.format.sheets) {
    const submissionSheet = submission.sheets.find((s) => s.sheetId === formatSheet.id);
    const sheetData = (submissionSheet?.data as Record<string, unknown>) || {};

    for (const field of formatSheet.fields) {
      const value = sheetData[field.fieldKey];
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        missingFields.push({
          sheet: formatSheet.name,
          field: field.fieldKey,
          label: field.label,
        });
      }
    }
  }

  if (missingFields.length > 0) {
    return res.status(422).json({
      error: 'Hay campos obligatorios sin completar',
      missingFields,
    });
  }

  const updated = await prisma.formSubmission.update({
    where: { id: paramId(req.params.id) },
    data: {
      status: SubmissionStatus.PENDING_REVIEW,
      submittedAt: new Date(),
    },
  });

  res.json(updated);
});

// Aprobar y firmar (admin)
router.post('/:id/approve', requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  const { notes } = req.body;

  const submission = await prisma.formSubmission.findUnique({
    where: { id: paramId(req.params.id) },
  });

  if (!submission) {
    return res.status(404).json({ error: 'Envío no encontrado' });
  }

  if (submission.status !== SubmissionStatus.PENDING_REVIEW) {
    return res.status(400).json({ error: 'Este envío no está pendiente de revisión' });
  }

  const updated = await prisma.formSubmission.update({
    where: { id: paramId(req.params.id) },
    data: {
      status: SubmissionStatus.APPROVED,
      reviewedAt: new Date(),
      reviewedById: req.user!.userId,
      reviewNotes: notes,
      signature: {
        create: {
          adminId: req.user!.userId,
          notes,
        },
      },
    },
    include: { signature: true },
  });

  res.json(updated);
});

// Rechazar (admin)
router.post('/:id/reject', requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  const { notes } = req.body;

  if (!notes) {
    return res.status(400).json({ error: 'Debe indicar el motivo del rechazo' });
  }

  const updated = await prisma.formSubmission.update({
    where: { id: paramId(req.params.id) },
    data: {
      status: SubmissionStatus.REJECTED,
      reviewedAt: new Date(),
      reviewedById: req.user!.userId,
      reviewNotes: notes,
    },
  });

  res.json(updated);
});

export default router;
