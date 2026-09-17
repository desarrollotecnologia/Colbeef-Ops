/**
 * Corrige workDate de borradores CONTROL_TEMP_PH_CANALES de Brayan Lopez
 * del 15/09/2026 → 14/09/2026 (debían quedar con fecha del 14).
 *
 * Uso:
 *   cd backend
 *   npx tsx scripts/fix-canales-workdate-sep14.ts --dry-run
 *   npx tsx scripts/fix-canales-workdate-sep14.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { parseWorkDate, workDateToString } from '../src/utils/workDate';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

const FROM = parseWorkDate('2026-09-15');
const TO = parseWorkDate('2026-09-14');
const FORMAT_CODE = 'CONTROL_TEMP_PH_CANALES';
const OPERATOR_HINT = 'Brayan';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Falta DATABASE_URL en backend/.env');
  }

  const submissions = await prisma.formSubmission.findMany({
    where: {
      status: SubmissionStatus.DRAFT,
      workDate: FROM,
      format: { code: FORMAT_CODE },
      operator: { fullName: { contains: OPERATOR_HINT } },
    },
    include: {
      format: { select: { code: true, name: true } },
      operator: { select: { fullName: true } },
      sheets: { select: { data: true } },
      _count: { select: { collaborators: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (submissions.length === 0) {
    console.log('No se encontraron borradores que coincidan (Brayan + canales + workDate 2026-09-15).');
    return;
  }

  console.log(`Encontrados ${submissions.length} envío(s):\n`);

  for (const sub of submissions) {
    let cliente = '';
    for (const sheet of sub.sheets) {
      const data = (sheet.data ?? {}) as Record<string, unknown>;
      const c = String(data.cliente ?? '').trim();
      if (c) {
        cliente = c;
        break;
      }
    }

    console.log(
      `[${dryRun ? 'DRY' : 'FIX'}] ${sub.format.name}` +
        (cliente ? ` — ${cliente}` : '') +
        `\n  Dueño: ${sub.operator.fullName}` +
        `\n  Colaboradores: ${sub._count.collaborators}` +
        `\n  workDate: ${workDateToString(sub.workDate)} → ${workDateToString(TO)}` +
        `\n  updatedAt: ${sub.updatedAt.toISOString()}` +
        `\n  id: ${sub.id}\n`
    );

    if (!dryRun) {
      await prisma.formSubmission.update({
        where: { id: sub.id },
        data: { workDate: TO },
      });
    }
  }

  console.log(
    dryRun
      ? `\nDry-run OK. Ejecuta sin --dry-run para guardar ${workDateToString(TO)} en la BD.`
      : `\n${submissions.length} envío(s) actualizado(s) a ${workDateToString(TO)}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
