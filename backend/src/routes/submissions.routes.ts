import { Router, Request, Response } from 'express';
import { SubmissionStatus, UsageEventType, UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticate, denyPanel, requireRole } from '../middleware/auth';
import { paramId } from '../utils/params';
import {
  assertWorkDateAllowed,
  getTodayWorkDate,
  isSameWorkDate,
} from '../utils/workDate';
import { getSubmissionMissingFields } from '../utils/fieldValidation';
import { buildPdfFilename, generateSubmissionPdf } from '../services/submissionPdf';
import { logUsageEvent } from '../services/usageLogger';

const router = Router();

router.use(authenticate);
router.use(denyPanel);

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

  if (status || formatId || from || to) {
    logUsageEvent({
      eventType: UsageEventType.SEARCH_EXECUTED,
      userId: req.user!.userId,
      username: req.user!.username,
      userRole: req.user!.role,
      path: '/api/submissions',
      metadata: { status, formatId, from, to },
    });
  }

  res.json(submissions);
});

// Pendientes de revisión (solo admin)
router.get('/pending', requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  logUsageEvent({
    eventType: UsageEventType.PENDING_VIEWED,
    userId: req.user!.userId,
    username: req.user!.username,
    userRole: req.user!.role,
    path: '/api/submissions/pending',
  });
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

const submissionInclude = {
  format: {
    include: {
      sheets: {
        orderBy: { sheetOrder: 'asc' as const },
        include: { fields: { orderBy: { sortOrder: 'asc' as const } } },
      },
    },
  },
  operator: { select: { id: true, fullName: true } },
  reviewedBy: { select: { id: true, fullName: true } },
  sheets: { include: { sheet: true } },
  signature: { include: { admin: { select: { id: true, fullName: true } } } },
};

// Crear borrador
router.post('/', requireRole(UserRole.OPERARIO), async (req: Request, res: Response) => {
  const { formatId } = req.body;

  if (!formatId) {
    return res.status(400).json({ error: 'formatId es obligatorio' });
  }

  const format = await prisma.format.findUnique({
    where: { id: formatId },
    include: { sheets: true },
  });

  if (!format) {
    return res.status(404).json({ error: 'Formato no encontrado' });
  }

  const parsedDate = getTodayWorkDate();
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
    include: submissionInclude,
  });

  logUsageEvent({
    eventType: UsageEventType.SUBMISSION_CREATED,
    userId: req.user!.userId,
    username: req.user!.username,
    userRole: req.user!.role,
    formatId: format.id,
    formatCode: format.code,
    formatName: format.name,
    submissionId: submission.id,
    path: '/api/submissions',
  });

  res.status(201).json(submission);
});

// Descargar PDF del formato completo (una página por hoja)
router.get('/:id/pdf', async (req: Request, res: Response) => {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: paramId(req.params.id) },
    include: submissionInclude,
  });

  if (!submission) {
    return res.status(404).json({ error: 'Envío no encontrado' });
  }

  const isAdmin = req.user!.role === UserRole.ADMIN;
  if (!isAdmin && submission.operatorId !== req.user!.userId) {
    return res.status(403).json({ error: 'No tiene acceso' });
  }

  const canDownload =
    submission.status === SubmissionStatus.APPROVED ||
    (isAdmin && submission.status === SubmissionStatus.PENDING_REVIEW);

  if (!canDownload) {
    return res.status(400).json({
      error: 'El PDF está disponible cuando el formato está aprobado o pendiente de revisión (admin).',
    });
  }

  try {
    const pdfBuffer = await generateSubmissionPdf(submission);
    const filename = buildPdfFilename(submission);
    logUsageEvent({
      eventType: UsageEventType.PDF_DOWNLOADED,
      userId: req.user!.userId,
      username: req.user!.username,
      userRole: req.user!.role,
      formatId: submission.formatId,
      formatCode: submission.format.code,
      formatName: submission.format.name,
      submissionId: submission.id,
      path: '/api/submissions/pdf',
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generando PDF:', err);
    return res.status(500).json({ error: 'No se pudo generar el PDF' });
  }
});

// Obtener envío con datos
router.get('/:id', async (req: Request, res: Response) => {
  let submission = await prisma.formSubmission.findUnique({
    where: { id: paramId(req.params.id) },
    include: submissionInclude,
  });

  if (!submission) {
    return res.status(404).json({ error: 'Envío no encontrado' });
  }

  const isAdmin = req.user!.role === UserRole.ADMIN;
  if (!isAdmin && submission.operatorId !== req.user!.userId) {
    return res.status(403).json({ error: 'No tiene acceso a este envío' });
  }

  const isEditable =
    submission.status === SubmissionStatus.DRAFT ||
    submission.status === SubmissionStatus.REJECTED;

  if (isEditable && !isAdmin && !isSameWorkDate(submission.workDate, getTodayWorkDate())) {
    submission = await prisma.formSubmission.update({
      where: { id: submission.id },
      data: { workDate: getTodayWorkDate() },
      include: submissionInclude,
    });
  }

  logUsageEvent({
    eventType: UsageEventType.SUBMISSION_OPENED,
    userId: req.user!.userId,
    username: req.user!.username,
    userRole: req.user!.role,
    formatId: submission.formatId,
    formatCode: submission.format.code,
    formatName: submission.format.name,
    submissionId: submission.id,
    path: '/api/submissions/:id',
    metadata: { status: submission.status },
  });

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

  await prisma.formSubmission.update({
    where: { id: submission.id },
    data: { workDate: getTodayWorkDate() },
  });

  const updated = await prisma.formSubmissionSheet.update({
    where: {
      submissionId_sheetId: {
        submissionId: paramId(req.params.id),
        sheetId: paramId(req.params.sheetId),
      },
    },
    data: { data },
    include: { sheet: { select: { name: true } }, submission: { include: { format: true } } },
  });

  logUsageEvent({
    eventType: UsageEventType.SHEET_SAVED,
    userId: req.user!.userId,
    username: req.user!.username,
    userRole: req.user!.role,
    formatId: updated.submission.formatId,
    formatCode: updated.submission.format.code,
    formatName: updated.submission.format.name,
    submissionId: updated.submissionId,
    sheetId: updated.sheetId,
    sheetName: updated.sheet.name,
    path: '/api/submissions/sheets',
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
            orderBy: { sheetOrder: 'asc' as const },
            include: { fields: { orderBy: { sortOrder: 'asc' as const } } },
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

  const today = getTodayWorkDate();
  if (!isSameWorkDate(submission.workDate, today)) {
    await prisma.formSubmission.update({
      where: { id: submission.id },
      data: { workDate: today },
    });
    submission.workDate = today;
  }

  const missingFields = getSubmissionMissingFields(
    submission.format.sheets.map((s) => ({
      id: s.id,
      name: s.name,
      fields: s.fields,
    })),
    submission.sheets.map((s) => ({ sheetId: s.sheetId, data: s.data })),
    submission.workDate
  );

  if (missingFields.length > 0) {
    const incompleteSheetNames = [...new Set(missingFields.map((f) => f.sheet))];
    logUsageEvent({
      eventType: UsageEventType.SUBMISSION_SUBMITTED_FAILED,
      userId: req.user!.userId,
      username: req.user!.username,
      userRole: req.user!.role,
      formatId: submission.formatId,
      formatCode: submission.format.code,
      formatName: submission.format.name,
      submissionId: submission.id,
      metadata: { incompleteSheets: incompleteSheetNames },
    });
    return res.status(422).json({
      error: `Debe completar todas las hojas del formato antes de entregar (${submission.format.sheets.length} hojas). Pendientes: ${incompleteSheetNames.join(', ')}`,
      missingFields,
      incompleteSheets: incompleteSheetNames,
    });
  }

  const updated = await prisma.formSubmission.update({
    where: { id: paramId(req.params.id) },
    data: {
      status: SubmissionStatus.PENDING_REVIEW,
      submittedAt: new Date(),
    },
    include: { format: true },
  });

  logUsageEvent({
    eventType: UsageEventType.SUBMISSION_SUBMITTED,
    userId: req.user!.userId,
    username: req.user!.username,
    userRole: req.user!.role,
    formatId: updated.formatId,
    formatCode: updated.format.code,
    formatName: updated.format.name,
    submissionId: updated.id,
    path: '/api/submissions/submit',
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
    include: {
      signature: { include: { admin: { select: { id: true, fullName: true } } } },
      reviewedBy: { select: { id: true, fullName: true } },
      format: true,
    },
  });

  logUsageEvent({
    eventType: UsageEventType.SUBMISSION_APPROVED,
    userId: req.user!.userId,
    username: req.user!.username,
    userRole: req.user!.role,
    formatId: updated.formatId,
    formatCode: updated.format.code,
    formatName: updated.format.name,
    submissionId: updated.id,
    path: '/api/submissions/approve',
  });

  res.json(updated);
});

// Eliminar borrador (solo el operario dueño)
router.delete('/:id', requireRole(UserRole.OPERARIO), async (req: Request, res: Response) => {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: paramId(req.params.id) },
  });

  if (!submission) {
    return res.status(404).json({ error: 'Envío no encontrado' });
  }

  if (submission.operatorId !== req.user!.userId) {
    return res.status(403).json({ error: 'No tiene acceso a este envío' });
  }

  if (submission.status !== SubmissionStatus.DRAFT) {
    return res.status(400).json({ error: 'Solo se pueden eliminar borradores' });
  }

  await prisma.formSubmission.delete({
    where: { id: submission.id },
  });

  const format = await prisma.format.findUnique({ where: { id: submission.formatId } });
  logUsageEvent({
    eventType: UsageEventType.SUBMISSION_DELETED,
    userId: req.user!.userId,
    username: req.user!.username,
    userRole: req.user!.role,
    formatId: submission.formatId,
    formatCode: format?.code,
    formatName: format?.name,
    submissionId: submission.id,
    path: '/api/submissions',
  });

  res.status(204).send();
});

// Rechazar (admin)
router.post('/:id/reject', requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  const { notes } = req.body;

  if (!notes) {
    return res.status(400).json({ error: 'Debe indicar el motivo del rechazo' });
  }

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
      status: SubmissionStatus.REJECTED,
      reviewedAt: new Date(),
      reviewedById: req.user!.userId,
      reviewNotes: notes,
    },
    include: { format: true },
  });

  logUsageEvent({
    eventType: UsageEventType.SUBMISSION_REJECTED,
    userId: req.user!.userId,
    username: req.user!.username,
    userRole: req.user!.role,
    formatId: updated.formatId,
    formatCode: updated.format.code,
    formatName: updated.format.name,
    submissionId: updated.id,
    path: '/api/submissions/reject',
    metadata: { notesLength: notes.length },
  });

  res.json(updated);
});

export default router;
