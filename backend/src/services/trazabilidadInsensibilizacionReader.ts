import { Pool, type QueryResultRow } from 'pg';
import { config, isTrazabilidadConfigured } from '../config';
import { horaLimiteTurno } from '../utils/turnoPcc';

export type FilaInsensibilizacion = {
  id: string;
  id_proceso: string | null;
  id_parte_producto: string | null;
  id_producto: string;
  fecha_registro: string | null;
  hora_registro: string | null;
  id_plan_faena: string | null;
  id_registro_turno: string | null;
  usuario_turno: string | null;
  nombre_empresa: string | null;
  fecha_asociacion: string | null;
  hora_asociacion: string | null;
};

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!isTrazabilidadConfigured()) return null;
  if (!pool) {
    const t = config.trazabilidad;
    pool = new Pool({
      host: t.host,
      port: t.port,
      database: t.database,
      user: t.user,
      password: t.password,
      max: 4,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
      options: `-c search_path=${t.searchPath}`,
    });
  }
  return pool;
}

export function isTrazabilidadReady(): boolean {
  return isTrazabilidadConfigured();
}

const SQL = `
SELECT DISTINCT ON (ins.id)
    ins.id,
    ins.id_proceso,
    ins.id_parte_producto,
    ins.id_producto,
    ins.fecha_registro,
    ins.hora_registro,
    pfp.id_plan_faena,
    pft.id_registro_turno,
    pft.user_name AS usuario_turno,
    e.nombre AS nombre_empresa,
    pe.fecha_registro AS fecha_asociacion,
    pe.hora_registro AS hora_asociacion
FROM trazabilidad_proceso.insensibilizacion ins
LEFT JOIN trazabilidad_proceso.producto p
    ON ins.id_producto = p.id
LEFT JOIN trazabilidad_proceso.informacion_ingreso_detalle iid
    ON p.numero_informacion_ingreso = iid.numero_informacion_ingreso
LEFT JOIN trazabilidad_proceso.plan_faena_producto pfp
    ON ins.id_producto = pfp.id_producto
LEFT JOIN trazabilidad_proceso.plan_faena_turno pft
    ON pfp.id_plan_faena = pft.id_plan_faena
LEFT JOIN trazabilidad_proceso.producto_empresa pe
    ON ins.id_producto = pe.id_producto
LEFT JOIN organizaciones.empresa e
    ON pe.id_empresa = e.id
WHERE ins.fecha_registro IS NOT NULL
    AND COALESCE(iid.emergencia, false) = false
    AND (
        (
            (ins.fecha_registro)::date = CAST($1 AS date)
            AND (
                ins.hora_registro IS NULL
                OR EXTRACT(HOUR FROM ins.hora_registro)::int >= $2
            )
        )
        OR (
            (ins.fecha_registro)::date = (CAST($1 AS date) + INTERVAL '1 day')::date
            AND ins.hora_registro IS NOT NULL
            AND EXTRACT(HOUR FROM ins.hora_registro)::int < $2
        )
    )
ORDER BY ins.id ASC, pe.fecha_registro DESC NULLS LAST, pe.hora_registro DESC NULLS LAST
LIMIT 5000
`;

function asStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

export async function filasParaDiaOperativo(fechaYmd: string): Promise<FilaInsensibilizacion[]> {
  const p = getPool();
  if (!p) return [];

  const hora = horaLimiteTurno();
  const result = await p.query<QueryResultRow>(SQL, [fechaYmd, hora]);

  return result.rows
    .map((row) => {
      const idProducto = asStr(row.id_producto);
      if (!idProducto) return null;
      return {
        id: String(row.id),
        id_proceso: asStr(row.id_proceso),
        id_parte_producto: asStr(row.id_parte_producto),
        id_producto: idProducto,
        fecha_registro: asStr(row.fecha_registro),
        hora_registro: asStr(row.hora_registro),
        id_plan_faena: asStr(row.id_plan_faena),
        id_registro_turno: asStr(row.id_registro_turno),
        usuario_turno: asStr(row.usuario_turno),
        nombre_empresa: asStr(row.nombre_empresa),
        fecha_asociacion: asStr(row.fecha_asociacion),
        hora_asociacion: asStr(row.hora_asociacion),
      } satisfies FilaInsensibilizacion;
    })
    .filter((r): r is FilaInsensibilizacion => Boolean(r));
}
