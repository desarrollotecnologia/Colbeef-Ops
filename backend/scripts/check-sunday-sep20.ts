import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const day = new Date(Date.UTC(2026, 8, 20)); // 2026-09-20 as @db.Date
  console.log('DATABASE_URL set:', Boolean(process.env.DATABASE_URL));

  const byWorkDate = await prisma.formSubmission.findMany({
    where: { workDate: day },
    include: {
      format: { select: { code: true, name: true } },
      operator: { select: { fullName: true } },
      _count: { select: { collaborators: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Domingo 20 sep 2026 en America/Bogota = UTC 05:00 del 20 al 05:00 del 21
  const start = new Date('2026-09-20T05:00:00.000Z');
  const end = new Date('2026-09-21T05:00:00.000Z');

  const byTouches = await prisma.formSubmission.findMany({
    where: {
      OR: [
        { createdAt: { gte: start, lt: end } },
        { updatedAt: { gte: start, lt: end } },
        { submittedAt: { gte: start, lt: end } },
      ],
    },
    include: {
      format: { select: { code: true, name: true } },
      operator: { select: { fullName: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  console.log('\n=== workDate = 2026-09-20 ===');
  console.log('total:', byWorkDate.length);
  for (const s of byWorkDate) {
    console.log(
      `- [${s.status}] ${s.format.name} | ${s.operator.fullName} | collab=${s._count.collaborators} | upd=${s.updatedAt.toISOString()} | id=${s.id}`
    );
  }

  console.log('\n=== Actividad el domingo 20 (crea/edita/entrega, hora Bogotá) ===');
  console.log('total:', byTouches.length);
  for (const s of byTouches) {
    console.log(
      `- [${s.status}] workDate=${s.workDate.toISOString().slice(0, 10)} | ${s.format.name} | ${s.operator.fullName} | upd=${s.updatedAt.toISOString()} | id=${s.id}`
    );
  }
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
