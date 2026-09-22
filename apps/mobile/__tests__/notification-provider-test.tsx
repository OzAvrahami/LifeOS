import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react-native';
import { AppState, Text } from 'react-native';
import * as Expo from 'expo-notifications';
import type { Session } from '@supabase/supabase-js';

import { useAuth } from '@/features/auth/auth-provider';
import { NotificationProvider } from '@/features/notifications/notification-provider';
import { notificationReconciler } from '@/features/notifications/notification.service';
import { defaultNotificationPreferences } from '@/features/notifications/notification.types';
import { createApiClient } from '@/lib/api/client';

const mockNavigate = jest.fn();
const mockRouter = { navigate: mockNavigate };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useRootNavigationState: () => ({ key: 'root' }) }));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/api/client', () => ({ createApiClient: jest.fn() }));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted', ios: { status: 2 } })),
  getAllScheduledNotificationsAsync: jest.fn(async () => []), getPresentedNotificationsAsync: jest.fn(async () => []),
  setNotificationHandler: jest.fn(), addNotificationResponseReceivedListener: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(async () => null), clearLastNotificationResponseAsync: jest.fn(async () => {}),
}));
const userId = '11111111-1111-4111-8111-111111111111';
const session = { user: { id: userId }, access_token: 'isolated-test-token' } as Session;
const response: Expo.NotificationResponse = { actionIdentifier: 'expo.modules.notifications.actions.DEFAULT', notification: { date: 100, request: { identifier: 'test', trigger: null, content: { title: 'Week', subtitle: null, body: 'Plan', sound: null, categoryIdentifier: null, data: { owner: 'lifeos', userId, kind: 'weekly' } } } } };
const settings = { persisted: true, timezone: 'Asia/Jerusalem', weekStartDay: 0, defaultDailyCapacityMinutes: 360, notifications: defaultNotificationPreferences };
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({ session, isLoading: false, isRecovery: false } as ReturnType<typeof useAuth>);
  jest.mocked(createApiClient).mockReturnValue(jest.fn(async path => path === '/settings' ? { settings } : path.startsWith('/commitments') ? { commitments: [] } : { tasks: [] }) as ReturnType<typeof createApiClient>);
  jest.mocked(Expo.getLastNotificationResponseAsync).mockResolvedValue(null);
});

it('reconciles bootstrap, foreground and persisted task/settings cache changes; cleans listeners and logs out safely', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  const remove = jest.fn();
  const appListener = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove });
  const responseRemove = jest.fn();
  jest.mocked(Expo.addNotificationResponseReceivedListener).mockReturnValue({ remove: responseRemove });
  const reconcile = jest.spyOn(notificationReconciler, 'reconcile');
  const tree = () => <QueryClientProvider client={client}><NotificationProvider><Text>App</Text></NotificationProvider></QueryClientProvider>;
  const view = await render(tree());
  await waitFor(() => expect(createApiClient).toHaveBeenCalledTimes(1));
  expect(reconcile).toHaveBeenCalledWith(userId, expect.any(Function));
  const captured = jest.mocked(createApiClient).mock.calls[0][0];
  expect(await captured.getAccessToken!()).toBe('isolated-test-token');
  await act(() => appListener.mock.calls[0][1]('active'));
  await waitFor(() => expect(createApiClient).toHaveBeenCalledTimes(2));
  await act(() => client.setQueryData(['tasks', userId, 'list'], []));
  await waitFor(() => expect(createApiClient).toHaveBeenCalledTimes(3));
  await act(() => client.setQueryData(['settings', userId], settings));
  await waitFor(() => expect(createApiClient).toHaveBeenCalledTimes(4));
  await act(() => client.setQueryData(['commitments', userId, 'list'], []));
  await waitFor(() => expect(createApiClient).toHaveBeenCalledTimes(5));
  jest.mocked(useAuth).mockReturnValue({ session: null, isLoading: false, isRecovery: false } as ReturnType<typeof useAuth>);
  await view.rerender(tree());
  await waitFor(() => expect(reconcile).toHaveBeenLastCalledWith(null, expect.any(Function)));
  expect(await captured.getAccessToken!()).toBe('isolated-test-token');
  await view.unmount();
  expect(remove).toHaveBeenCalled(); expect(responseRemove).toHaveBeenCalled();
  expect(Expo.setNotificationHandler).toHaveBeenLastCalledWith(null);
  client.clear(); appListener.mockRestore(); reconcile.mockRestore();
});

it('handles cold start and listener taps once, with deliberate foreground display and stale-account suppression', async () => {
  const appListener = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const remove = jest.fn();
  jest.mocked(Expo.addNotificationResponseReceivedListener).mockReturnValue({ remove });
  jest.mocked(Expo.getLastNotificationResponseAsync).mockResolvedValue(response);
  const view = await render(<QueryClientProvider client={client}><NotificationProvider><Text>App</Text></NotificationProvider></QueryClientProvider>);
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/week' }));
  const listener = jest.mocked(Expo.addNotificationResponseReceivedListener).mock.calls[0][0];
  await act(() => listener(response)); expect(mockNavigate).toHaveBeenCalledTimes(1);
  const taskResponse = { ...response, notification: { ...response.notification, date: 101, request: { ...response.notification.request, content: { ...response.notification.request.content, data: { owner: 'lifeos', userId, kind: 'task', taskId: userId } } } } };
  await act(() => listener(taskResponse));
  expect(mockNavigate).toHaveBeenLastCalledWith({ pathname: '/task', params: { id: userId } });
  const handler = jest.mocked(Expo.setNotificationHandler).mock.calls[0][0]!;
  expect(await handler.handleNotification(response.notification)).toEqual({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false });
  const foreign = { ...taskResponse, notification: { ...taskResponse.notification, request: { ...taskResponse.notification.request, content: { ...taskResponse.notification.request.content, data: { owner: 'lifeos', userId: 'other', kind: 'weekly' } } } } };
  await act(() => listener(foreign)); expect(mockNavigate).toHaveBeenCalledTimes(2);
  expect((await handler.handleNotification(foreign.notification)).shouldShowBanner).toBe(false);
  expect(Expo.clearLastNotificationResponseAsync).toHaveBeenCalled();
  await view.unmount();
  await act(() => listener({ ...response, notification: { ...response.notification, date: 200 } }));
  expect(mockNavigate).toHaveBeenCalledTimes(2); expect(remove).toHaveBeenCalledTimes(1);
  client.clear(); appListener.mockRestore();
});
