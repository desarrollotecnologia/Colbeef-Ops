import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { FORMAT_CATALOG } from './seeds/format-catalog';
import { getFieldsForSheet } from './seeds/fields';

const prisma = new PrismaClient();

async function seedUsers() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const operarioPassword = await bcrypt.hash('operario123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@colbeef.local',
      passwordHash: adminPassword,
      fullName: 'Administrador / Jefe de Área',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { username: 'operario' },
    update: {},
    create: {
      username: 'operario',
      email: 'operario@colbeef.local',
      passwordHash: operarioPassword,
      fullName: 'Operario de Planta',
      role: 'OPERARIO',
    },
  });

  const panelPassword = await bcrypt.hash('123456789', 10);
  await prisma.user.upsert({
    where: { username: 'panel' },
    update: {
      passwordHash: panelPassword,
      role: 'PANEL',
      active: true,
    },
    create: {
      username: 'panel',
      email: 'panel@colbeef.local',
      passwordHash: panelPassword,
      fullName: 'Panel de Usabilidad',
      role: 'PANEL',
    },
  });
}

async function seedFormats() {
  let totalFields = 0;

  for (const formatDef of FORMAT_CATALOG) {
    const format = await prisma.format.upsert({
      where: { code: formatDef.code },
      update: {
        name: formatDef.name,
        documentCode: formatDef.documentCode,
        sheetCount: formatDef.sheetCount,
        sortOrder: formatDef.sortOrder,
        noSunday: formatDef.noSunday,
      },
      create: {
        code: formatDef.code,
        name: formatDef.name,
        documentCode: formatDef.documentCode,
        sheetCount: formatDef.sheetCount,
        sortOrder: formatDef.sortOrder,
        noSunday: formatDef.noSunday,
      },
    });

    for (const sheetDef of formatDef.sheets) {
      const sheet = await prisma.formatSheet.upsert({
        where: {
          formatId_sheetOrder: {
            formatId: format.id,
            sheetOrder: sheetDef.sheetOrder,
          },
        },
        update: { name: sheetDef.name, slug: sheetDef.slug },
        create: {
          formatId: format.id,
          sheetOrder: sheetDef.sheetOrder,
          name: sheetDef.name,
          slug: sheetDef.slug,
        },
      });

      const fields = getFieldsForSheet(formatDef.code, sheetDef.slug);
      const existingFields = await prisma.formatField.findMany({
        where: { sheetId: sheet.id },
        select: { id: true, fieldKey: true },
      });
      const keepKeys = new Set(fields.map((f) => f.fieldKey));
      const toDelete = existingFields.filter((f) => !keepKeys.has(f.fieldKey));
      if (toDelete.length > 0) {
        await prisma.formatField.deleteMany({
          where: { id: { in: toDelete.map((f) => f.id) } },
        });
      }

      for (const f of fields) {
        await prisma.formatField.upsert({
          where: {
            sheetId_fieldKey: { sheetId: sheet.id, fieldKey: f.fieldKey },
          },
          update: {
            label: f.label,
            fieldType: f.fieldType,
            required: f.required ?? false,
            manualOnly: f.manualOnly ?? true,
            autoFillRule: f.autoFillRule ?? null,
            options: f.options ?? undefined,
            config: f.config ?? undefined,
            placeholder: f.placeholder,
            defaultValue: f.defaultValue,
            sortOrder: f.sortOrder,
            groupName: f.groupName,
            helpText: f.helpText,
          },
          create: {
            sheetId: sheet.id,
            fieldKey: f.fieldKey,
            label: f.label,
            fieldType: f.fieldType,
            required: f.required ?? false,
            manualOnly: f.manualOnly ?? true,
            autoFillRule: f.autoFillRule ?? null,
            options: f.options ?? undefined,
            config: f.config ?? undefined,
            placeholder: f.placeholder,
            defaultValue: f.defaultValue,
            sortOrder: f.sortOrder,
            groupName: f.groupName,
            helpText: f.helpText,
          },
        });
        totalFields += 1;
      }
    }
  }

  return totalFields;
}

async function main() {
  console.log('Sembrando base de datos Colbeef-Ops...\n');

  await seedUsers();
  console.log('✓ Usuarios creados');

  const totalFields = await seedFormats();
  console.log(`✓ ${FORMAT_CATALOG.length} formatos con ${totalFields} campos`);

  console.log('\nSeed completado.');
  console.log('Usuarios de prueba:');
  console.log('  Admin:    admin / admin123');
  console.log('  Operario: operario / operario123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
