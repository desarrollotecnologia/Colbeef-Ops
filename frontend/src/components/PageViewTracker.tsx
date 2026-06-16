import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { trackUsageEvent } from '@/lib/usageTracking';

export default function PageViewTracker() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role === 'PANEL') return;
    trackUsageEvent('PAGE_VIEW', location.pathname);
  }, [location.pathname, user]);

  return null;
}
