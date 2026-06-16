import api from '@/lib/api';

export function trackUsageEvent(
  eventType: 'PAGE_VIEW' | 'LOGOUT' | 'SEARCH_EXECUTED',
  path?: string,
  metadata?: Record<string, unknown>
) {
  api
    .post('/analytics/events', { eventType, path, metadata })
    .catch(() => {
      /* telemetría opcional */
    });
}
