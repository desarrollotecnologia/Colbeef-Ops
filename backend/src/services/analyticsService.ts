import { SubmissionStatus, UsageEventType, UserRole } from '@prisma/client';
import prisma from '../lib/prisma';

const EVENT_LABELS: Record<UsageEventType, string> = {
  LOGIN: 'Inicio de sesión',
  LOGIN_FAILED: 'Login fallido',
  LOGOUT: 'Cierre de sesión',
  PAGE_VIEW: 'Vista de página',
  SUBMISSION_CREATED: 'Formato iniciado',
  SHEET_SAVED: 'Hoja guardada',
  SUBMISSION_SUBMITTED: 'Formato entregado',
  SUBMISSION_SUBMITTED_FAILED: 'Entrega incompleta',
  SUBMISSION_APPROVED: 'Formato aprobado',
  SUBMISSION_REJECTED: 'Formato rechazado',
  SUBMISSION_DELETED: 'Borrador eliminado',
  SUBMISSION_OPENED: 'Formato abierto',
  PDF_DOWNLOADED: 'PDF descargado',
  SEARCH_EXECUTED: 'Búsqueda',
  PENDING_VIEWED: 'Cola pendientes',
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

export async function getAnalyticsDashboard(days = 30) {
  const since = daysAgo(days);
  const todayStart = startOfDay(new Date());

  const [
    totalEvents,
    eventsToday,
    eventsByTypeRaw,
    eventsByDayRaw,
    topUsersRaw,
    topFormatsRaw,
    recentActivity,
    submissionsByStatus,
    usersWithEvents,
    hourlyTodayRaw,
    loginEventsToday,
    uniqueUsersToday,
  ] = await Promise.all([
    prisma.usageEvent.count({ where: { createdAt: { gte: since } } }),
    prisma.usageEvent.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.usageEvent.groupBy({
      by: ['eventType'],
      where: { createdAt: { gte: since }, userRole: { not: UserRole.PANEL } },
      _count: { _all: true },
      orderBy: { _count: { eventType: 'desc' } },
    }),
    prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM usage_events
      WHERE created_at >= ${since}
        AND (user_role IS NULL OR user_role != 'PANEL')
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `,
    prisma.$queryRaw<
      { user_id: string; username: string; full_name: string; user_role: string; event_count: bigint }[]
    >`
      SELECT e.user_id, e.username, u.full_name, e.user_role, COUNT(*) as event_count
      FROM usage_events e
      LEFT JOIN users u ON u.id = e.user_id
      WHERE e.created_at >= ${since}
        AND e.user_id IS NOT NULL
        AND (e.user_role IS NULL OR e.user_role != 'PANEL')
      GROUP BY e.user_id, e.username, u.full_name, e.user_role
      ORDER BY event_count DESC
      LIMIT 10
    `,
    prisma.usageEvent.groupBy({
      by: ['formatCode', 'formatName'],
      where: {
        createdAt: { gte: since },
        formatCode: { not: null },
        userRole: { not: UserRole.PANEL },
      },
      _count: { _all: true },
      orderBy: { _count: { formatCode: 'desc' } },
      take: 8,
    }),
    prisma.usageEvent.findMany({
      where: {
        createdAt: { gte: since },
        userRole: { not: UserRole.PANEL },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: { user: { select: { fullName: true } } },
    }),
    prisma.formSubmission.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: { role: { in: [UserRole.ADMIN, UserRole.OPERARIO] }, active: true },
      select: { id: true, username: true, fullName: true, role: true },
    }),
    prisma.$queryRaw<{ hour: number; count: bigint }[]>`
      SELECT HOUR(created_at) as hour, COUNT(*) as count
      FROM usage_events
      WHERE created_at >= ${todayStart}
        AND (user_role IS NULL OR user_role != 'PANEL')
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
    `,
    prisma.usageEvent.count({
      where: { eventType: UsageEventType.LOGIN, createdAt: { gte: todayStart } },
    }),
    prisma.usageEvent.findMany({
      where: { createdAt: { gte: todayStart }, userId: { not: null }, userRole: { not: UserRole.PANEL } },
      distinct: ['userId'],
      select: { userId: true },
    }),
  ]);

  const eventsByType = eventsByTypeRaw.map((row) => ({
    type: row.eventType,
    label: EVENT_LABELS[row.eventType] ?? row.eventType,
    count: row._count._all,
  }));

  const eventsByDay = eventsByDayRaw.map((row) => ({
    date: String(row.day).slice(0, 10),
    count: Number(row.count),
  }));

  const topUsers = topUsersRaw.map((row) => ({
    userId: row.user_id,
    username: row.username,
    fullName: row.full_name ?? row.username,
    role: row.user_role,
    eventCount: Number(row.event_count),
  }));

  const topFormats = topFormatsRaw
    .filter((row) => row.formatCode)
    .map((row) => ({
      formatCode: row.formatCode!,
      formatName: row.formatName ?? row.formatCode!,
      count: row._count._all,
    }));

  const roleActivity = await prisma.usageEvent.groupBy({
    by: ['userRole'],
    where: { createdAt: { gte: since }, userRole: { in: [UserRole.ADMIN, UserRole.OPERARIO] } },
    _count: { _all: true },
  });

  const usersByRole = roleActivity.map((row) => ({
    role: row.userRole === UserRole.ADMIN ? 'Administrador' : 'Operario',
    count: row._count._all,
  }));

  const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
    const found = hourlyTodayRaw.find((r) => Number(r.hour) === hour);
    return { hour: `${hour.toString().padStart(2, '0')}:00`, count: found ? Number(found.count) : 0 };
  });

  const pageViews = await prisma.usageEvent.groupBy({
    by: ['path'],
    where: {
      eventType: UsageEventType.PAGE_VIEW,
      createdAt: { gte: since },
      path: { not: null },
      userRole: { not: UserRole.PANEL },
    },
    _count: { _all: true },
    orderBy: { _count: { path: 'desc' } },
    take: 10,
  });

  const topPages = pageViews.map((row) => ({
    path: row.path!,
    label: pagePathLabel(row.path!),
    count: row._count._all,
  }));

  return {
    periodDays: days,
    summary: {
      totalEvents,
      eventsToday,
      activeUsersToday: uniqueUsersToday.length,
      loginsToday: loginEventsToday,
      registeredUsers: usersWithEvents.length,
    },
    eventsByType,
    eventsByDay,
    usersByRole,
    topUsers,
    topFormats,
    topPages,
    hourlyActivity,
    submissionsByStatus: submissionsByStatus.map((row) => ({
      status: row.status,
      label: submissionStatusLabel(row.status),
      count: row._count._all,
    })),
    recentActivity: recentActivity.map((ev) => ({
      id: ev.id,
      eventType: ev.eventType,
      label: EVENT_LABELS[ev.eventType] ?? ev.eventType,
      username: ev.username,
      fullName: ev.user?.fullName ?? ev.username,
      userRole: ev.userRole,
      path: ev.path,
      formatName: ev.formatName,
      sheetName: ev.sheetName,
      createdAt: ev.createdAt.toISOString(),
      metadata: ev.metadata,
    })),
    users: usersWithEvents.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
    })),
  };
}

function pagePathLabel(path: string): string {
  const map: Record<string, string> = {
    '/': 'Inicio operario',
    '/submissions': 'Mis envíos',
    '/admin': 'Panel admin',
    '/admin/pending': 'Pendientes',
    '/admin/search': 'Búsqueda',
    '/panel': 'Panel usabilidad',
  };
  if (map[path]) return map[path];
  if (path.startsWith('/admin/review/')) return 'Revisión de formato';
  if (path.startsWith('/submissions/')) return 'Llenar formato';
  if (path.startsWith('/formats/')) return 'Nuevo formato';
  return path;
}

function submissionStatusLabel(status: SubmissionStatus): string {
  const map: Record<SubmissionStatus, string> = {
    DRAFT: 'Borrador',
    PENDING_REVIEW: 'Pendiente',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
  };
  return map[status];
}
