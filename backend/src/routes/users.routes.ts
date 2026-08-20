import { randomUUID } from 'crypto';
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { paramId } from '../utils/params';

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

const userSelect = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  formatAccess: {
    select: { formatId: true, format: { select: { id: true, code: true, name: true, sortOrder: true } } },
    orderBy: { format: { sortOrder: 'asc' as const } },
  },
};

function mapUser(u: {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  formatAccess: { formatId: string; format: { id: string; code: string; name: string; sortOrder: number } }[];
}) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    formatIds: u.formatAccess.map((a) => a.formatId),
    formats: u.formatAccess.map((a) => a.format),
  };
}

/** Lista formatos activos (para checklist de permisos). */
router.get('/formats-catalog', async (_req: Request, res: Response) => {
  const formats = await prisma.format.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, code: true, name: true, documentCode: true, sortOrder: true },
  });
  res.json(formats);
});

router.get('/', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { role: { in: [UserRole.ADMIN, UserRole.OPERARIO] } },
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    select: userSelect,
  });
  res.json(users.map(mapUser));
});

router.get('/:id', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: paramId(req.params.id) },
    select: userSelect,
  });
  if (!user || user.role === UserRole.PANEL) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json(mapUser(user));
});

router.post('/', async (req: Request, res: Response) => {
  const { username, password, fullName, email, role, active = true, formatIds = [] } = req.body as {
    username?: string;
    password?: string;
    fullName?: string;
    email?: string;
    role?: string;
    active?: boolean;
    formatIds?: string[];
  };

  if (!username?.trim() || !password || !fullName?.trim()) {
    return res.status(400).json({ error: 'Usuario, contraseña y nombre son obligatorios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const roleValue = (role ?? 'OPERARIO').toUpperCase() as UserRole;
  if (roleValue !== UserRole.ADMIN && roleValue !== UserRole.OPERARIO) {
    return res.status(400).json({ error: 'El rol debe ser ADMIN u OPERARIO' });
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username: username.trim() }, { email: (email ?? `${username.trim()}@colbeef.local`).trim() }],
    },
  });
  if (existing) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese nombre de usuario o correo' });
  }

  const uniqueFormatIds = [...new Set((formatIds ?? []).filter(Boolean))];
  if (roleValue === UserRole.OPERARIO && uniqueFormatIds.length > 0) {
    const count = await prisma.format.count({ where: { id: { in: uniqueFormatIds }, active: true } });
    if (count !== uniqueFormatIds.length) {
      return res.status(400).json({ error: 'Uno o más formatos no son válidos' });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username: username.trim(),
      email: (email ?? `${username.trim()}@colbeef.local`).trim(),
      fullName: fullName.trim(),
      role: roleValue,
      active: Boolean(active),
      passwordHash,
      formatAccess:
        roleValue === UserRole.OPERARIO && uniqueFormatIds.length > 0
          ? { create: uniqueFormatIds.map((formatId) => ({ formatId })) }
          : undefined,
    },
    select: userSelect,
  });

  res.status(201).json(mapUser(user));
});

router.patch('/:id', async (req: Request, res: Response) => {
  const id = paramId(req.params.id);
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.role === UserRole.PANEL) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const { fullName, email, role, active, formatIds } = req.body as {
    fullName?: string;
    email?: string;
    role?: string;
    active?: boolean;
    formatIds?: string[];
  };

  let roleValue = existing.role;
  if (role !== undefined) {
    const r = role.toUpperCase() as UserRole;
    if (r !== UserRole.ADMIN && r !== UserRole.OPERARIO) {
      return res.status(400).json({ error: 'El rol debe ser ADMIN u OPERARIO' });
    }
    roleValue = r;
  }

  if (email && email.trim() !== existing.email) {
    const clash = await prisma.user.findFirst({ where: { email: email.trim(), NOT: { id } } });
    if (clash) return res.status(409).json({ error: 'Ese correo ya está en uso' });
  }

  if (Array.isArray(formatIds) && roleValue === UserRole.OPERARIO) {
    const uniqueFormatIds = [...new Set(formatIds.filter(Boolean))];
    if (uniqueFormatIds.length > 0) {
      const count = await prisma.format.count({ where: { id: { in: uniqueFormatIds }, active: true } });
      if (count !== uniqueFormatIds.length) {
        return res.status(400).json({ error: 'Uno o más formatos no son válidos' });
      }
    }
    await prisma.$transaction([
      prisma.userFormatAccess.deleteMany({ where: { userId: id } }),
      ...(uniqueFormatIds.length
        ? [
            prisma.userFormatAccess.createMany({
              data: uniqueFormatIds.map((formatId) => ({
                id: randomUUID(),
                userId: id,
                formatId,
              })),
            }),
          ]
        : []),
      prisma.user.update({
        where: { id },
        data: {
          fullName: fullName?.trim() || undefined,
          email: email?.trim() || undefined,
          role: roleValue,
          active: active !== undefined ? Boolean(active) : undefined,
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      ...(roleValue === UserRole.ADMIN
        ? [prisma.userFormatAccess.deleteMany({ where: { userId: id } })]
        : []),
      prisma.user.update({
        where: { id },
        data: {
          fullName: fullName?.trim() || undefined,
          email: email?.trim() || undefined,
          role: roleValue,
          active: active !== undefined ? Boolean(active) : undefined,
        },
      }),
    ]);
  }

  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  res.json(mapUser(user!));
});

router.patch('/:id/password', async (req: Request, res: Response) => {
  const id = paramId(req.params.id);
  const { password } = req.body as { password?: string };

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.role === UserRole.PANEL) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  res.json({ ok: true, message: 'Contraseña actualizada' });
});

/** Elimina el usuario de la BD (libera usuario/contraseña). */
router.delete('/:id', async (req: Request, res: Response) => {
  const id = paramId(req.params.id);
  const actorId = req.user?.userId;

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, fullName: true, role: true },
  });
  if (!existing || existing.role === UserRole.PANEL) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  if (actorId && existing.id === actorId) {
    return res.status(400).json({ error: 'No puede eliminar su propia cuenta' });
  }

  const [asOperator, asSigner, adminCount] = await Promise.all([
    prisma.formSubmission.count({ where: { operatorId: id } }),
    prisma.signature.count({ where: { adminId: id } }),
    existing.role === UserRole.ADMIN
      ? prisma.user.count({ where: { role: UserRole.ADMIN, active: true, NOT: { id } } })
      : Promise.resolve(1),
  ]);

  if (asOperator > 0) {
    return res.status(409).json({
      error: `No fue posible borrar el usuario ${existing.fullName}: tiene formatos/historial asociados como operario`,
    });
  }
  if (asSigner > 0) {
    return res.status(409).json({
      error: `No fue posible borrar el usuario ${existing.fullName}: firmó envíos como administrador`,
    });
  }
  if (existing.role === UserRole.ADMIN && adminCount < 1) {
    return res.status(409).json({
      error: `No fue posible borrar el usuario ${existing.fullName}: es el único administrador activo`,
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.formSubmission.updateMany({
        where: { submittedById: id },
        data: { submittedById: null },
      });
      await tx.formSubmission.updateMany({
        where: { reviewedById: id },
        data: { reviewedById: null },
      });
      await tx.submissionFieldLock.deleteMany({ where: { filledById: id } });
      await tx.submissionCollaborator.deleteMany({ where: { addedById: id } });
      await tx.userFormatAccess.deleteMany({ where: { userId: id } });
      await tx.usageEvent.updateMany({ where: { userId: id }, data: { userId: null } });
      await tx.user.delete({ where: { id } });
    });
  } catch {
    return res.status(409).json({
      error: `No fue posible borrar el usuario ${existing.fullName}`,
    });
  }

  res.json({
    ok: true,
    message: `Se eliminó el usuario ${existing.fullName}`,
    deleted: { id: existing.id, username: existing.username, fullName: existing.fullName },
  });
});

export default router;
