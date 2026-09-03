/**
 * Restaura workDate = fecha en que se empezó a llenar (createdAt del envío).
 * Corrige envíos que pasaron por rechazo y quedaron con la fecha del reenvío.
 *
 * Uso:
 *   cd backend && npm run fix:workdate-rejected
 *   npm run fix:workdate-rejected -- --dry-run
 *   npm run fix:workdate-rejected -- --format=MONITOREO_TITULACION_ACIDO_LACTICO --operator=Brayan
 */
import { PrismaClient, SubmissionActivityType } from '@prisma/client';
import { isSameWorkDate, parseWorkDate, workDateToString } from '../src/utils/workDate';

const prisma = new PrismaClient();
const BOGOTA_TZ = 'America/Bogota';
const dryRun = process.argv.includes('--dry-run');

function argValue(prefix: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${prefix}=`));
  return hit?.slice(prefix.length + 1)?.trim();
}

function timestampToWorkDate(at: Date): Date {
  const ymd = at.toLocaleDateString('en-CA', { timeZone: BOGOTA_TZ });
  return parseWorkDate(ymd);
}

async function main() {
  const formatCode = argValue('--format');
  const operatorHint = argValue('--operator');

  const submissions = await prisma.formSubmission.findMany({
    where: {
      ...(formatCode
        ? { format: { code: formatCode } }
        : { activities: { some: { type: SubmissionActivityType.REJECTED } } }),
      ...(operatorHint
        ? { operator: { fullName: { contains: operatorHint } } }
        : {}),
    },
    include: {
      activities: { orderBy: { createdAt: 'asc' } },
      format: { select: { code: true, name: true } },
      operator: { select: { fullName: true } },
    },
  });

  let fixed = 0;

  for (const sub of submissions) {
    const wasRejected = sub.activities.some((a) => a.type === SubmissionActivityType.REJECTED);
    if (!wasRejected && !formatCode) continue;

    // Fecha operativa = día en que se creó el envío (empezó a llenar)
    const originalWorkDate = timestampToWorkDate(sub.createdAt);
    if (isSameWorkDate(sub.workDate, originalWorkDate)) continue;

    console.log(
      `[${dryRun ? 'DRY' : 'FIX'}] ${sub.format.name} · ${sub.operator.fullName} · ` +
        `${workDateToString(sub.workDate)} → ${workDateToString(originalWorkDate)} · id=${sub.id}`
    );

    if (!dryRun) {
      await prisma.formSubmission.update({
        where: { id: sub.id },
        data: { workDate: originalWorkDate },
      });
    }
    fixed += 1;
  }

  if (fixed === 0) {
    console.log('Ningún envío requiere corrección (o no coincide el filtro).');
  } else {
    console.log(`\n${fixed} envío(s) ${dryRun ? 'a corregir' : 'corregido(s)'}.`);
    console.log('Vuelva a descargar el PDF para ver la fecha actualizada en el encabezado.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
