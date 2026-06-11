/**
 * Crear o actualizar un usuario Colbeef-Ops.
 *
 * Uso:
 *   npx tsx scripts/create-user.ts <username> <password> "<nombre completo>" <ADMIN|OPERARIO> [email]
 *
 * Ejemplo operario:
 *   npx tsx scripts/create-user.ts jperez MiClave123 "Juan Pérez" OPERARIO jperez@colbeef.local
 *
 * Ejemplo admin (jefe de área):
 *   npx tsx scripts/create-user.ts mgarcia AdminClave456 "María García" ADMIN mgarcia@colbeef.local
 */
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [, , username, password, fullName, roleArg, emailArg] = process.argv;

  if (!username || !password || !fullName || !roleArg) {
    console.error('Uso: npx tsx scripts/create-user.ts <username> <password> "<nombre>" <ADMIN|OPERARIO> [email]');
    process.exit(1);
  }

  const role = roleArg.toUpperCase() as UserRole;
  if (role !== 'ADMIN' && role !== 'OPERARIO') {
    console.error('El rol debe ser ADMIN u OPERARIO');
    process.exit(1);
  }

  const email = emailArg ?? `${username}@colbeef.local`;
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      fullName,
      role,
      email,
      active: true,
    },
    create: {
      username,
      passwordHash,
      fullName,
      role,
      email,
      active: true,
    },
  });

  console.log(`Usuario listo: ${user.username} (${user.fullName}) — rol ${user.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
