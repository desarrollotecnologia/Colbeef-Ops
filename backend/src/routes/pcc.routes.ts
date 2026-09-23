import { Router, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticate, denyPanel } from '../middleware/auth';
import {
  fechaOperativaPccYmd,
  parseOperativeDate,
} from '../utils/turnoPcc';
import {
  filasParaDiaOperativo,
  isTrazabilidadReady,
  type FilaInsensibilizacion,
} from '../services/trazabilidadInsensibilizacionReader';

const router = Router();

router.use(authenticate);
router.use(denyPanel);

async function userCanAccessPcc(userId: string, role: UserRole): Promise<boolean> {
  if (role === UserRole.ADMIN) return true;
  const access = await prisma.userPccAccess.findUnique({ where: { userId } });
  return Boolean(access);
}

function requirePccAccess() {
  return async (req: Request, res: Response, next: () => void) => {
    const ok = await userCanAccessPcc(req.user!.userId, req.user!.role);
    if (!ok) {
      return res.status(403).json({ error: 'No tiene acceso al módulo Verificación PCC' });
    }
    next();
  };
}

router.get('/access', async (req: Request, res: Response) => {
  const canAccess = await userCanAccessPcc(req.user!.userId, req.user!.role);
  res.json({
    canAccess,
    trazabilidadConfigured: isTrazabilidadReady(),
    fechaOperativa: fechaOperativaPccYmd(),
  });
});

router.use(requirePccAccess());

async function idsVerificadosEnTurno(fechaYmd: string): Promise<Set<string>> {
  const byWork = await prisma.pccVerificacion.findMany({
    where: { workDate: parseOperativeDate(fechaYmd) },
    select: { externalInsId: true },
  });
  return new Set(byWork.map((r) => r.externalInsId));
}

function pendientes(
  externas: FilaInsensibilizacion[],
  verificados: Set<string>
): FilaInsensibilizacion[] {
  return externas.filter((f) => f.id_producto && !verificados.has(String(f.id)));
}

router.get('/cola', async (req: Request, res: Response) => {
  const fechaYmd = typeof req.query.fecha === 'string' && req.query.fecha
    ? req.query.fecha
    : fechaOperativaPccYmd();

  if (!isTrazabilidadReady()) {
    return res.json({
      fechaOperativa: fechaYmd,
      trazabilidadConfigured: false,
      total: 0,
      verificados: 0,
      pendientes: 0,
      actual: null,
      message: 'La base de datos de trazabilidad/SIRT no está configurada.',
    });
  }

  try {
    const externas = await filasParaDiaOperativo(fechaYmd);
    const verificados = await idsVerificadosEnTurno(fechaYmd);
    const pend = pendientes(externas, verificados);
    const actual = pend[0] ?? null;

    res.json({
      fechaOperativa: fechaYmd,
      trazabilidadConfigured: true,
      total: externas.length,
      verificados: verificados.size,
      pendientes: pend.length,
      actual: actual
        ? {
            externalInsId: String(actual.id),
            idProducto: actual.id_producto,
            propietario: actual.nombre_empresa || '—',
            snapshot: actual,
          }
        : null,
      message: externas.length === 0
        ? 'No hay insensibilizaciones externas para este día operativo.'
        : pend.length === 0
          ? 'No hay productos pendientes por verificar en este turno.'
          : null,
    });
  } catch (err) {
    console.error('[pcc/cola]', err);
    res.status(502).json({
      error: 'No se pudo consultar la BD de trazabilidad/SIRT',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

router.post('/verificar', async (req: Request, res: Response) => {
  const {
    externalInsId,
    idProducto,
    snapshot,
    cumpleMediaCanal1,
    cumpleMediaCanal2,
    observacion,
    accionCorrectiva,
    responsablePuesto,
  } = req.body as {
    externalInsId?: string;
    idProducto?: string;
    snapshot?: unknown;
    cumpleMediaCanal1?: boolean | number | string;
    cumpleMediaCanal2?: boolean | number | string;
    observacion?: string;
    accionCorrectiva?: string;
    responsablePuesto?: string;
  };

  const toBool = (v: unknown): boolean | null => {
    if (v === true || v === 1 || v === '1') return true;
    if (v === false || v === 0 || v === '0') return false;
    return null;
  };

  const mc1 = toBool(cumpleMediaCanal1);
  const mc2 = toBool(cumpleMediaCanal2);

  if (!externalInsId || !idProducto) {
    return res.status(400).json({ error: 'externalInsId e idProducto son obligatorios' });
  }
  if (mc1 === null || mc2 === null) {
    return res.status(400).json({ error: 'Debe indicar cumplimiento de media canal 1 y 2' });
  }

  const fechaYmd = fechaOperativaPccYmd();
  const workDate = parseOperativeDate(fechaYmd);

  try {
    const created = await prisma.pccVerificacion.create({
      data: {
        userId: req.user!.userId,
        externalInsId: String(externalInsId),
        idProducto: String(idProducto),
        snapshotExterno: (snapshot ?? {}) as object,
        cumpleMediaCanal1: mc1,
        cumpleMediaCanal2: mc2,
        observacion: observacion?.trim() || null,
        accionCorrectiva: accionCorrectiva?.trim() || null,
        responsablePuesto: responsablePuesto?.trim() || null,
        workDate,
      },
      include: { user: { select: { id: true, fullName: true, username: true } } },
    });

    // Siguiente pendiente
    let siguiente = null;
    let counts = { total: 0, verificados: 0, pendientes: 0 };
    if (isTrazabilidadReady()) {
      const externas = await filasParaDiaOperativo(fechaYmd);
      const verificados = await idsVerificadosEnTurno(fechaYmd);
      const pend = pendientes(externas, verificados);
      counts = { total: externas.length, verificados: verificados.size, pendientes: pend.length };
      const next = pend[0];
      if (next) {
        siguiente = {
          externalInsId: String(next.id),
          idProducto: next.id_producto,
          propietario: next.nombre_empresa || '—',
          snapshot: next,
        };
      }
    }

    res.status(201).json({
      ok: true,
      registro: created,
      fechaOperativa: fechaYmd,
      ...counts,
      actual: siguiente,
      message: siguiente ? null : 'No hay más pendientes en este turno.',
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') {
      return res.status(409).json({ error: 'Ese producto ya fue verificado en este turno' });
    }
    console.error('[pcc/verificar]', err);
    res.status(500).json({ error: 'No se pudo guardar la verificación' });
  }
});

const HISTORIAL_PAGE_SIZE = 20;

function mapHistorialRow(r: {
  id: string;
  idProducto: string;
  externalInsId: string;
  cumpleMediaCanal1: boolean;
  cumpleMediaCanal2: boolean;
  observacion: string | null;
  accionCorrectiva: string | null;
  responsablePuesto: string | null;
  snapshotExterno: unknown;
  createdAt: Date;
  user: { id: string; fullName: string; username: string };
}) {
  return {
    id: r.id,
    idProducto: r.idProducto,
    externalInsId: r.externalInsId,
    cumpleMediaCanal1: r.cumpleMediaCanal1,
    cumpleMediaCanal2: r.cumpleMediaCanal2,
    observacion: r.observacion,
    accionCorrectiva: r.accionCorrectiva,
    responsablePuesto: r.responsablePuesto,
    propietario:
      (r.snapshotExterno as { nombre_empresa?: string } | null)?.nombre_empresa ?? null,
    createdAt: r.createdAt,
    user: r.user,
  };
}

router.get('/historial', async (req: Request, res: Response) => {
  const fechaYmd =
    typeof req.query.fecha === 'string' && req.query.fecha
      ? req.query.fecha
      : fechaOperativaPccYmd();

  const pageRaw = parseInt(String(req.query.page ?? '1'), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = HISTORIAL_PAGE_SIZE;
  const where = { workDate: parseOperativeDate(fechaYmd) };

  const [total, rows] = await Promise.all([
    prisma.pccVerificacion.count({ where }),
    prisma.pccVerificacion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { id: true, fullName: true, username: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  res.json({
    fechaOperativa: fechaYmd,
    total,
    page,
    pageSize,
    totalPages,
    registros: rows.map(mapHistorialRow),
  });
});

router.get('/historial/excel', async (req: Request, res: Response) => {
  const todos = req.query.todos === '1' || req.query.todos === 'true';
  const fechaYmd =
    typeof req.query.fecha === 'string' && req.query.fecha
      ? req.query.fecha
      : todos
        ? null
        : fechaOperativaPccYmd();

  try {
    const where = fechaYmd ? { workDate: parseOperativeDate(fechaYmd) } : {};
    const rows = await prisma.pccVerificacion.findMany({
      where,
      orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }],
      include: { user: { select: { id: true, fullName: true, username: true } } },
    });

    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Colbeef-Ops';
    const ws = wb.addWorksheet('Historial PCC');

    ws.columns = [
      { header: 'Fecha y hora', key: 'fecha', width: 22 },
      { header: 'ID producto', key: 'idProducto', width: 16 },
      { header: 'Propietario', key: 'propietario', width: 40 },
      { header: 'Media canal 1', key: 'mc1', width: 14 },
      { header: 'Media canal 2', key: 'mc2', width: 14 },
      { header: 'Responsable puesto', key: 'responsable', width: 24 },
      { header: 'Observación', key: 'observacion', width: 36 },
      { header: 'Acción correctiva', key: 'accion', width: 36 },
      { header: 'Usuario registro', key: 'usuario', width: 28 },
      { header: 'ID ins. externo', key: 'externalInsId', width: 20 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle' };

    for (const r of rows) {
      const mapped = mapHistorialRow(r);
      ws.addRow({
        fecha: new Date(mapped.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
        idProducto: mapped.idProducto,
        propietario: mapped.propietario || '—',
        mc1: mapped.cumpleMediaCanal1 ? 'Cumple' : 'No cumple',
        mc2: mapped.cumpleMediaCanal2 ? 'Cumple' : 'No cumple',
        responsable: mapped.responsablePuesto || '—',
        observacion: mapped.observacion || '',
        accion: mapped.accionCorrectiva || '',
        usuario: mapped.user.fullName,
        externalInsId: mapped.externalInsId,
      });
    }

    const suffix = fechaYmd ? fechaYmd.replace(/-/g, '') : 'todos';
    const filename = `verificacion-pcc_historial_${suffix}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('[pcc/historial/excel]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'No se pudo generar el Excel' });
    }
  }
});

export { userCanAccessPcc };
export default router;
