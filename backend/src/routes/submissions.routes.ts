import { Router, Request, Response } from 'express';
import {
  Prisma,
  SubmissionActivityType,
  SubmissionStatus,
  UsageEventType,
  UserRole,
} from '@prisma/client';
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
import {
  applySchemaSnapshotToFormat,
  buildFormatSchemaSnapshot,
} from '../utils/schemaSnapshot';
import { assertOperatorCanAccessFormat } from '../utils/formatAccess';
import { getSubmissionAccess, assertCanEditSubmission } from '../utils/submissionAccess';
import { mergeSheetDataWithLocks } from '../utils/fieldLocks';
import { logSubmissionActivity } from '../utils/submissionActivity';
import { isMultiDayFormat } from '../utils/multiDayFormats';

const router = Router();

router.use(authenticate);
router.use(denyPanel);

const userBrief = { select: { id: true, fullName: true, username: true } };

const collaborationInclude = {
  collaborators: {
    include: {
      user: userBrief,
      addedBy: userBrief,
    },
    orderBy: { addedAt: 'asc' as const },
  },
  fieldLocks: {
    include: { filledBy: userBrief },
  },
  activities: {
    include: {
      actor: userBrief,
      targetUser: userBrief,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  submittedBy: userBrief,
};

const submissionInclude = {
  format: {
    include: {
      sheets: {
        orderBy: { sheetOrder: 'asc' as const },
        include: { fields: { orderBy: { sortOrder: 'asc' as const } } },
      },
    },
  },
  operator: userBrief,
  reviewedBy: userBrief,
  sheets: { include: { sheet: true } },
  signature: { include: { admin: userBrief } },
  ...collaborationInclude,
};

function withFrozenSchema<T extends Parameters<typeof applySchemaSnapshotToFormat>[0]>(submission: T) {
  return applySchemaSnapshotToFormat(submission);
}

function enrichForViewer<
  T extends {
    operatorId: string;
    collaborators?: { userId: string; addedBy?: { id: string; fullName: string } | null }[];
  },
>(submission: T, viewerId: string, viewerRole: UserRole) {
  const isOwner = submission.operatorId === viewerId;
  const collab = submission.collaborators?.find((c) => c.userId === viewerId);
  let myRole: 'OWNER' | 'COLLABORATOR' | 'ADMIN' | null = null;
  if (viewerRole === UserRole.ADMIN) myRole = 'ADMIN';
  else if (isOwner) myRole = 'OWNER';
  else if (collab) myRole = 'COLLABORATOR';

  return {
    ...submission,
    myRole,
    addedBy: collab?.addedBy ?? null,
  };
}

// Listar envíos (operario: propios + colaboraciones; admin: todos)
router.get('/', async (req: Request, res: Response) => {
  const { status, formatId, workDate, from, to } = req.query;
  const isAdmin = req.user!.role === UserRole.ADMIN;
  const userId = req.user!.userId;

  const where: Record<string, unknown> = {};

  if (!isAdmin) {
    where.OR = [{ operatorId: userId }, { collaborators: { some: { userId } } }];
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
    orderBy: { updatedAt: 'desc' },
    include: {
      format: { select: { id: true, code: true, name: true } },
      operator: userBrief,
      reviewedBy: userBrief,
      submittedBy: userBrief,
      signature: true,
      collaborators: {
        include: { user: userBrief, addedBy: userBrief },
      },
      _count: { select: { sheets: true, collaborators: true } },
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

  res.json(submissions.map((s) => enrichForViewer(s, userId, req.user!.role)));
});

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
      operator: userBrief,
      submittedBy: userBrief,
      collaborators: { include: { user: userBrief } },
    },
  });
  res.json(pending);
});

// Crear borrador
router.post('/', requireRole(UserRole.OPERARIO), async (req: Request, res: Response) => {
  const { formatId } = req.body;

  if (!formatId) {
    return res.status(400).json({ error: 'formatId es obligatorio' });
  }

  const format = await prisma.format.findUnique({
    where: { id: formatId },
    include: {
      sheets: {
        orderBy: { sheetOrder: 'asc' },
        include: { fields: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  });

  if (!format) {
    return res.status(404).json({ error: 'Formato no encontrado' });
  }
  if (!format.active) {
    return res.status(400).json({ error: 'Este formato no está activo' });
  }

  const access = await assertOperatorCanAccessFormat(req.user!.userId, req.user!.role, formatId);
  if (!access.ok) {
    return res.status(403).json({ error: access.error });
  }

  const parsedDate = getTodayWorkDate();
  const dateCheck = await assertWorkDateAllowed(prisma, formatId, parsedDate);
  if (!dateCheck.ok) {
    return res.status(400).json({ error: dateCheck.error });
  }

  const schemaSnapshot = buildFormatSchemaSnapshot(format.sheets);

  const submission = await prisma.formSubmission.create({
    data: {
      formatId,
      operatorId: req.user!.userId,
      workDate: parsedDate,
      schemaSnapshot,
      sheets: {
        create: format.sheets.map((sheet) => ({
          sheetId: sheet.id,
          data: {},
        })),
      },
    },
    include: submissionInclude,
  });

  await logSubmissionActivity({
    submissionId: submission.id,
    type: SubmissionActivityType.CREATED,
    actorId: req.user!.userId,
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

  const refreshed = await prisma.formSubmission.findUnique({
    where: { id: submission.id },
    include: submissionInclude,
  });

  res.status(201).json(
    enrichForViewer(withFrozenSchema(refreshed!), req.user!.userId, req.user!.role)
  );
});

// Candidatos a colaborador (operarios con acceso al formato)
router.get('/:id/collaborator-candidates', requireRole(UserRole.OPERARIO), async (req: Request, res: Response) => {
  const submissionId = paramId(req.params.id);
  const access = await getSubmissionAccess(submissionId, req.user!.userId, req.user!.role);
  if (!access.ok || access.role !== 'OWNER') {
    return res.status(403).json({ error: 'Solo el dueño puede gestionar colaboradores' });
  }

  const submission = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
    select: {
      formatId: true,
      operatorId: true,
      collaborators: { select: { userId: true } },
    },
  });
  if (!submission) return res.status(404).json({ error: 'Envío no encontrado' });

  const excludeIds = [submission.operatorId, ...submission.collaborators.map((c) => c.userId)];

  const candidates = await prisma.user.findMany({
    where: {
      role: UserRole.OPERARIO,
      active: true,
      id: { notIn: excludeIds },
      formatAccess: { some: { formatId: submission.formatId } },
    },
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true, username: true },
  });

  res.json(candidates);
});

// Agregar colaborador
router.post('/:id/collaborators', requireRole(UserRole.OPERARIO), async (req: Request, res: Response) => {
  const submissionId = paramId(req.params.id);
  const { userId } = req.body as { userId?: string };

  if (!userId) return res.status(400).json({ error: 'userId es obligatorio' });

  const access = await getSubmissionAccess(submissionId, req.user!.userId, req.user!.role);
  if (!access.ok || access.role !== 'OWNER') {
    return res.status(403).json({ error: 'Solo el dueño puede agregar colaboradores' });
  }

  const submission = await prisma.formSubmission.findUnique({ where: { id: submissionId } });
  if (!submission) return res.status(404).json({ error: 'Envío no encontrado' });

  if (submission.status !== SubmissionStatus.DRAFT && submission.status !== SubmissionStatus.REJECTED) {
    return res.status(400).json({ error: 'Solo se pueden agregar colaboradores en borrador o rechazado' });
  }

  if (userId === submission.operatorId) {
    return res.status(400).json({ error: 'El dueño ya forma parte del envío' });
  }

  const candidate = await prisma.user.findUnique({ where: { id: userId } });
  if (!candidate || candidate.role !== UserRole.OPERARIO || !candidate.active) {
    return res.status(400).json({ error: 'Usuario no válido' });
  }

  const formatAccess = await assertOperatorCanAccessFormat(userId, UserRole.OPERARIO, submission.formatId);
  if (!formatAccess.ok) {
    return res.status(400).json({ error: 'Ese operario no tiene acceso a este formato' });
  }

  try {
    await prisma.submissionCollaborator.create({
      data: {
        submissionId,
        userId,
        addedById: req.user!.userId,
      },
    });
  } catch {
    return res.status(409).json({ error: 'Ese usuario ya es colaborador' });
  }

  await logSubmissionActivity({
    submissionId,
    type: SubmissionActivityType.COLLABORATOR_ADDED,
    actorId: req.user!.userId,
    targetUserId: userId,
  });

  const updated = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
    include: submissionInclude,
  });

  res.status(201).json(
    enrichForViewer(withFrozenSchema(updated!), req.user!.userId, req.user!.role)
  );
});

// Quitar colaborador
router.delete('/:id/collaborators/:userId', requireRole(UserRole.OPERARIO), async (req: Request, res: Response) => {
  const submissionId = paramId(req.params.id);
  const targetUserId = paramId(req.params.userId);

  const access = await getSubmissionAccess(submissionId, req.user!.userId, req.user!.role);
  if (!access.ok || access.role !== 'OWNER') {
    return res.status(403).json({ error: 'Solo el dueño puede quitar colaboradores' });
  }

  const submission = await prisma.formSubmission.findUnique({ where: { id: submissionId } });
  if (!submission) return res.status(404).json({ error: 'Envío no encontrado' });

  if (submission.status !== SubmissionStatus.DRAFT && submission.status !== SubmissionStatus.REJECTED) {
    return res.status(400).json({ error: 'Solo se pueden quitar colaboradores en borrador o rechazado' });
  }

  const deleted = await prisma.submissionCollaborator.deleteMany({
    where: { submissionId, userId: targetUserId },
  });
  if (deleted.count === 0) {
    return res.status(404).json({ error: 'Colaborador no encontrado' });
  }

  await logSubmissionActivity({
    submissionId,
    type: SubmissionActivityType.COLLABORATOR_REMOVED,
    actorId: req.user!.userId,
    targetUserId,
  });

  const updated = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
    include: submissionInclude,
  });

  res.json(enrichForViewer(withFrozenSchema(updated!), req.user!.userId, req.user!.role));
});

// Descargar PDF
router.get('/:id/pdf', async (req: Request, res: Response) => {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: paramId(req.params.id) },
    include: submissionInclude,
  });

  if (!submission) {
    return res.status(404).json({ error: 'Envío no encontrado' });
  }

  const access = await getSubmissionAccess(paramId(req.params.id), req.user!.userId, req.user!.role);
  if (!access.ok) {
    return res.status(403).json({ error: access.error });
  }

  const isAdmin = req.user!.role === UserRole.ADMIN;
  const canDownload =
    isAdmin ||
    (access.isEditor &&
      (submission.status === SubmissionStatus.APPROVED ||
        submission.status === SubmissionStatus.DRAFT ||
        submission.status === SubmissionStatus.PENDING_REVIEW ||
        submission.status === SubmissionStatus.REJECTED));

  if (!canDownload) {
    return res.status(400).json({
      error: 'No tiene permiso para descargar el PDF de este envío.',
    });
  }

  try {
    const sheetId = typeof req.query.sheetId === 'string' ? req.query.sheetId : undefined;
    const scopeAll = req.query.scope === 'all';
    let sheetName: string | undefined;

    const frozenSubmission = withFrozenSchema(submission);

    if (sheetId) {
      sheetName = frozenSubmission.format.sheets.find((s) => s.id === sheetId)?.name;
      if (!sheetName) {
        return res.status(400).json({ error: 'Hoja no encontrada en el formato.' });
      }
    }

    const pdfBuffer = await generateSubmissionPdf(frozenSubmission, {
      sheetId: scopeAll ? undefined : sheetId,
      sheetBoundaries: scopeAll || !sheetId,
    });

    const filename = buildPdfFilename(frozenSubmission, {
      sheetName,
      allSheets: scopeAll || !sheetId,
    });

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

// Obtener envío
router.get('/:id', async (req: Request, res: Response) => {
  let submission = await prisma.formSubmission.findUnique({
    where: { id: paramId(req.params.id) },
    include: submissionInclude,
  });

  if (!submission) {
    return res.status(404).json({ error: 'Envío no encontrado' });
  }

  const access = await getSubmissionAccess(submission.id, req.user!.userId, req.user!.role);
  if (!access.ok) {
    return res.status(403).json({ error: access.error });
  }

  const isAdmin = req.user!.role === UserRole.ADMIN;
  const isEditable =
    submission.status === SubmissionStatus.DRAFT ||
    submission.status === SubmissionStatus.REJECTED;

  // Formatos diarios: la fecha de trabajo sigue el día actual.
  // Formatos multi-día (semanales): conservar fecha de inicio.
  if (
    isEditable &&
    !isAdmin &&
    access.isEditor &&
    !isMultiDayFormat(submission.format.code) &&
    !isSameWorkDate(submission.workDate, getTodayWorkDate())
  ) {
    submission = await prisma.formSubmission.update({
      where: { id: submission.id },
      data: { workDate: getTodayWorkDate() },
      include: submissionInclude,
    });
  }

  if (
    (submission.status === SubmissionStatus.DRAFT || submission.status === SubmissionStatus.REJECTED) &&
    !submission.schemaSnapshot
  ) {
    const schemaSnapshot = buildFormatSchemaSnapshot(submission.format.sheets);
    submission = await prisma.formSubmission.update({
      where: { id: submission.id },
      data: { schemaSnapshot },
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

  res.json(enrichForViewer(withFrozenSchema(submission), req.user!.userId, req.user!.role));
});

// Guardar hoja
router.put('/:id/sheets/:sheetId', requireRole(UserRole.OPERARIO), async (req: Request, res: Response) => {
  const { data } = req.body;
  const submissionId = paramId(req.params.id);
  const sheetId = paramId(req.params.sheetId);

  const editCheck = await assertCanEditSubmission(submissionId, req.user!.userId, req.user!.role);
  if (!editCheck.ok) {
    return res.status(editCheck.status).json({ error: editCheck.error });
  }

  const submission = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
    include: {
      format: {
        select: {
          code: true,
          name: true,
          sheets: {
            where: { id: sheetId },
            include: { fields: { select: { fieldKey: true, options: true } } },
          },
        },
      },
      operator: { select: { fullName: true } },
    },
  });
  if (!submission) return res.status(404).json({ error: 'Envío no encontrado' });

  if (submission.status !== SubmissionStatus.DRAFT && submission.status !== SubmissionStatus.REJECTED) {
    return res.status(400).json({ error: 'Este envío ya no se puede editar' });
  }

  const existingSheet = await prisma.formSubmissionSheet.findUnique({
    where: {
      submissionId_sheetId: { submissionId, sheetId },
    },
  });
  if (!existingSheet) {
    return res.status(404).json({ error: 'Hoja no encontrada' });
  }

  const existingData = (existingSheet.data ?? {}) as Record<string, unknown>;
  const incomingData = (data ?? {}) as Record<string, unknown>;

  const sheetFields = submission.format.sheets[0]?.fields ?? [];
  const fieldOptionsByKey: Record<string, unknown> = {};
  for (const f of sheetFields) {
    fieldOptionsByKey[f.fieldKey] = f.options ?? undefined;
  }

  const actor = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { fullName: true },
  });

  const mergeResult = await mergeSheetDataWithLocks({
    submissionId,
    sheetId,
    userId: req.user!.userId,
    userName: actor?.fullName ?? req.user!.username,
    existingData,
    incomingData,
    fieldOptionsByKey,
  });

  if (!mergeResult.ok) {
    return res.status(409).json({
      error: mergeResult.error,
      conflicts: mergeResult.conflicts,
    });
  }

  const draftPatch: {
    workDate?: Date;
    schemaSnapshot?: ReturnType<typeof buildFormatSchemaSnapshot>;
  } = {};
  if (!isMultiDayFormat(submission.format.code)) {
    draftPatch.workDate = getTodayWorkDate();
  }
  if (!submission.schemaSnapshot) {
    const full = await prisma.formSubmission.findUnique({
      where: { id: submission.id },
      include: {
        format: {
          include: {
            sheets: {
              orderBy: { sheetOrder: 'asc' },
              include: { fields: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
      },
    });
    if (full?.format?.sheets) {
      draftPatch.schemaSnapshot = buildFormatSchemaSnapshot(full.format.sheets);
    }
  }

  if (Object.keys(draftPatch).length > 0) {
    await prisma.formSubmission.update({
      where: { id: submission.id },
      data: draftPatch,
    });
  }

  const updated = await prisma.formSubmissionSheet.update({
    where: {
      submissionId_sheetId: { submissionId, sheetId },
    },
    data: { data: mergeResult.merged as Prisma.InputJsonValue },
    include: { sheet: { select: { name: true } }, submission: { include: { format: true } } },
  });

  await logSubmissionActivity({
    submissionId,
    type: SubmissionActivityType.SHEET_SAVED,
    actorId: req.user!.userId,
    metadata: {
      sheetId,
      sheetName: updated.sheet.name,
      changedFieldKeys: mergeResult.changedFieldKeys,
      changedCount: mergeResult.changedFieldKeys.length,
    },
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

  const locks = await prisma.submissionFieldLock.findMany({
    where: { submissionId, sheetId },
    include: { filledBy: userBrief },
  });

  res.json({ ...updated, fieldLocks: locks });
});

// Entregar
router.post('/:id/submit', requireRole(UserRole.OPERARIO), async (req: Request, res: Response) => {
  const submissionId = paramId(req.params.id);
  const editCheck = await assertCanEditSubmission(submissionId, req.user!.userId, req.user!.role);
  if (!editCheck.ok) {
    return res.status(editCheck.status).json({ error: editCheck.error });
  }

  const submission = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
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

  if (!submission) return res.status(404).json({ error: 'Envío no encontrado' });

  if (submission.status !== SubmissionStatus.DRAFT && submission.status !== SubmissionStatus.REJECTED) {
    return res.status(400).json({ error: 'Este envío ya fue entregado' });
  }

  if (!isMultiDayFormat(submission.format.code)) {
    const today = getTodayWorkDate();
    if (!isSameWorkDate(submission.workDate, today)) {
      await prisma.formSubmission.update({
        where: { id: submission.id },
        data: { workDate: today },
      });
      submission.workDate = today;
    }
  }

  const forValidation = withFrozenSchema(submission);

  const missingFields = getSubmissionMissingFields(
    forValidation.format.sheets.map((s) => ({
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

  const schemaSnapshot =
    (submission.schemaSnapshot as object | null) ??
    buildFormatSchemaSnapshot(forValidation.format.sheets);

  const updated = await prisma.formSubmission.update({
    where: { id: submissionId },
    data: {
      status: SubmissionStatus.PENDING_REVIEW,
      submittedAt: new Date(),
      submittedById: req.user!.userId,
      schemaSnapshot,
    },
    include: { format: true, submittedBy: userBrief, operator: userBrief },
  });

  await logSubmissionActivity({
    submissionId,
    type: SubmissionActivityType.SUBMITTED,
    actorId: req.user!.userId,
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

// Aprobar
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
      signature: { include: { admin: userBrief } },
      reviewedBy: userBrief,
      format: true,
      operator: userBrief,
      submittedBy: userBrief,
    },
  });

  await logSubmissionActivity({
    submissionId: updated.id,
    type: SubmissionActivityType.APPROVED,
    actorId: req.user!.userId,
    notes: notes ?? null,
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

// Eliminar borrador (solo dueño)
router.delete('/:id', requireRole(UserRole.OPERARIO), async (req: Request, res: Response) => {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: paramId(req.params.id) },
  });

  if (!submission) {
    return res.status(404).json({ error: 'Envío no encontrado' });
  }

  if (submission.operatorId !== req.user!.userId) {
    return res.status(403).json({ error: 'Solo el dueño puede eliminar el borrador' });
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

// Rechazar
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

  await logSubmissionActivity({
    submissionId: updated.id,
    type: SubmissionActivityType.REJECTED,
    actorId: req.user!.userId,
    notes,
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
