import { Router, Request, Response } from 'express';
import { UsageEventType, UserRole } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { getAnalyticsDashboard } from '../services/analyticsService';
import { logUsageEvent } from '../services/usageLogger';

const router = Router();

router.use(authenticate);

router.get('/dashboard', requireRole(UserRole.PANEL), async (req: Request, res: Response) => {
  const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
  const data = await getAnalyticsDashboard(days);
  res.json(data);
});

router.post('/events', async (req: Request, res: Response) => {
  const { eventType, path, metadata } = req.body as {
    eventType?: string;
    path?: string;
    metadata?: Record<string, unknown>;
  };

  if (req.user!.role === UserRole.PANEL) {
    return res.status(204).send();
  }

  const allowed: UsageEventType[] = [
    UsageEventType.PAGE_VIEW,
    UsageEventType.LOGOUT,
    UsageEventType.SEARCH_EXECUTED,
  ];

  if (!eventType || !allowed.includes(eventType as UsageEventType)) {
    return res.status(400).json({ error: 'Tipo de evento no permitido' });
  }

  logUsageEvent({
    eventType: eventType as UsageEventType,
    userId: req.user!.userId,
    username: req.user!.username,
    userRole: req.user!.role,
    path: path ?? undefined,
    metadata: metadata ?? undefined,
  });

  res.status(204).send();
});

export default router;
