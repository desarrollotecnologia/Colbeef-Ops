import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  /** Hora de cierre del turno PCC (Bogotá). Por defecto 7. */
  pccTurnoHoraFin: parseInt(process.env.VERIFICACION_PCC_TURNO_HORA_FIN || '7', 10),
  trazabilidad: {
    host: process.env.POSTGRES_HOST || process.env.DB_TRAZABILIDAD_HOST || '',
    port: parseInt(process.env.POSTGRES_PORT || process.env.DB_TRAZABILIDAD_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || process.env.DB_TRAZABILIDAD_DATABASE || '',
    user: process.env.POSTGRES_USER || process.env.DB_TRAZABILIDAD_USERNAME || '',
    password: process.env.POSTGRES_PASSWORD || process.env.DB_TRAZABILIDAD_PASSWORD || '',
    searchPath:
      process.env.DB_TRAZABILIDAD_SEARCH_PATH || 'trazabilidad_proceso,organizaciones,public',
  },
};

export function isTrazabilidadConfigured(): boolean {
  const t = config.trazabilidad;
  return Boolean(t.host && t.database && t.user);
}
