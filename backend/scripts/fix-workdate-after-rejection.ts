/**
 * Restaura workDate en envíos que pasaron por rechazo y quedaron con fecha del reenvío.
 * Usa la fecha del movimiento CREATED como fecha operativa original.
 *
 * Uso: cd backend && npx tsx scripts/fix-workdate-after-rejection.ts
 * Opcional: npx tsx scripts/fix-workdate-after-rejection.ts --dry-run
 */
import { PrismaClient, SubmissionActivityType } from '@prisma/client';
import { isSameWorkDate, parseWorkDate, workDateToString } from '../src/utils/workDate';

const prisma = new PrismaClient();
const BOGOTA_TZ = 'America/Bogota';
const dryRun = process.argv.includes('--dry-run');

function activityToWorkDate(createdAt: Date): Date {
  const ymd = createdAt.toLocaleDateString('en-CA', { timeZone: BOGOTA_TZ });
  return parseWorkDate(ymd);
}

async function main() {
  const submissions = await prisma.formSubmission.findMany({
    where: {
      activities: { some: { type: SubmissionActivityType.REJECTED } },
    },
    include: {
      activities: { orderBy: { createdAt: 'asc' } },
      format: { select: { code: true, name: true } },
      operator: { select: { fullName: true } },
    },
  });

  let fixed = 0;

  for (const sub of submissions) {
    const created = sub.activities.find((a) => a.type === SubmissionActivityType.CREATED);
    if (!created) continue;

    const originalWorkDate = activityToWorkDate(created.createdAt);
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

  console.log(`\n${fixed} envío(s) ${dryRun ? 'a corregir' : 'corregido(s)'}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
