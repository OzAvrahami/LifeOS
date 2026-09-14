import { useQueryClient } from '@tanstack/react-query';
import type { NotificationResponse } from 'expo-notifications';
import { useRootNavigationState, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';
import { normalizeSettings } from '@/features/settings/settings.api';
import type { Task } from '@/features/tasks/task.types';
import { createApiClient } from '@/lib/api/client';

import { NotificationResponseRouter } from './notification-routing';
import { getNativeNotifications } from './notification-module';
import { getNotificationPermission, localNotificationsSupported, notificationReconciler, requestNotificationPermission } from './notification.service';
import type { NotificationPermission, ReconciliationResult } from './notification.types';
import { NotificationContext } from './notification-context';

export function NotificationProvider({ children }: PropsWithChildren) {
  const { session, isLoading, isRecovery } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigation = useRootNavigationState();
  const userId = session?.user.id ?? null;
  const activeUser = useRef(userId);
  useLayoutEffect(() => { activeUser.current = userId; }, [userId]);
  const [permission, setPermission] = useState<NotificationPermission>('not_requested');
  const [error, setError] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const responseRouter = useRef(new NotificationResponseRouter());

  const reconcile = useCallback(async () => {
    if (isLoading || !localNotificationsSupported) return;
    const scope = session?.user.id ?? null;
    return notificationReconciler.reconcile(scope, async () => {
        // Capture this session's token, never fetch another account's snapshot
        // through a token getter that can change while a request is in flight.
        const request = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_URL, getAccessToken: async () => session?.access_token ?? null });
        const [settingsResponse, tasksResponse] = await Promise.all([
          request<{ settings: unknown }>('/settings', { auth: 'required' }),
          request<{ tasks: Task[] }>('/tasks?reminders=true', { auth: 'required' }),
        ]);
        const settings = normalizeSettings(settingsResponse.settings);
        if (!settings.notifications) throw new Error('Notification storage is not available');
        return { preferences: settings.notifications, tasks: tasksResponse.tasks };
      }).then(async next => {
      if (scope !== activeUser.current || !next) return;
      const currentPermission = await getNotificationPermission();
      if (scope !== activeUser.current) return;
      setResult(next); setPermission(currentPermission); setError(false);
    }).catch(() => { if (scope === activeUser.current) setError(true); });
  }, [isLoading, session]);

  const requestPermission = useCallback(async () => {
    try { setPermission(await requestNotificationPermission()); await reconcile(); }
    catch { setError(true); }
  }, [reconcile]);

  useEffect(() => {
    void reconcile();
    const resume = AppState.addEventListener('change', state => { if (state === 'active') void reconcile(); });
    let disposed = false;
    let queued = false;
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      const key = event.query.queryKey;
      if (event.type !== 'updated' || event.action.type !== 'success' || key[1] !== userId || !['tasks', 'settings'].includes(String(key[0])) || queued) return;
      queued = true;
      // Coalesce synchronous cache updates from one persisted mutation.
      void Promise.resolve().then(() => { queued = false; if (!disposed) void reconcile(); });
    });
    return () => { disposed = true; resume.remove(); unsubscribe(); };
  }, [queryClient, reconcile, userId]);

  useEffect(() => {
    if (!localNotificationsSupported) return;
    let disposed = false;
    let cleanup = () => {};
    void getNativeNotifications().then(api => {
      if (disposed) return;
      api.setNotificationHandler({ handleNotification: async notification => {
        const data = notification.request.content.data;
        const display = data?.owner !== 'lifeos' || (Boolean(activeUser.current) && data.userId === activeUser.current);
        return { shouldShowBanner: display, shouldShowList: display, shouldPlaySound: false, shouldSetBadge: false };
      } });
      cleanup = () => api.setNotificationHandler(null);
    }).catch(() => { if (!disposed) setError(true); });
    return () => { disposed = true; cleanup(); };
  }, []);

  useEffect(() => {
    if (!localNotificationsSupported || isLoading || isRecovery || !navigation?.key) return;
    let disposed = false;
    let cleanup = () => {};
    void getNativeNotifications().then(async api => {
      if (disposed) return;
      const respond = (response: NotificationResponse) => {
        if (disposed) return;
        const destination = responseRouter.current.consume(response.notification.request, response.notification.date, activeUser.current);
        if (destination) router.navigate(destination as Href);
        void api.clearLastNotificationResponseAsync().catch(() => { if (!disposed) setError(true); });
      };
      const subscription = api.addNotificationResponseReceivedListener(respond);
      cleanup = () => subscription.remove();
      const last = await api.getLastNotificationResponseAsync();
      if (last) respond(last);
    }).catch(() => { if (!disposed) setError(true); });
    return () => { disposed = true; cleanup(); };
  }, [isLoading, isRecovery, navigation?.key, router, userId]);

  return <NotificationContext.Provider value={{ permission: localNotificationsSupported ? permission : 'unavailable', result, error, reconcile, requestPermission }}>{children}</NotificationContext.Provider>;
}
