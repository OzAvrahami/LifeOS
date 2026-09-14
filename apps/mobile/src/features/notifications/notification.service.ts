import type * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { NotificationReconciler } from './notification-reconciler';
import { getNativeNotifications as native } from './notification-module';
import type { NotificationDriver, NotificationPermission } from './notification.types';

export const localNotificationsSupported = Platform.OS === 'ios';

export function permissionState(result: Notifications.NotificationPermissionsStatus): NotificationPermission {
  // iOS authorization enum: notDetermined=0, denied=1, authorized=2,
  // provisional=3, ephemeral=4. Provisional delivery remains system-controlled.
  if (result.granted || [2, 3, 4].includes(result.ios?.status ?? -1)) return 'allowed';
  if (result.status === 'undetermined' && result.canAskAgain) return 'not_requested';
  return 'denied';
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!localNotificationsSupported) return 'unavailable';
  return permissionState(await (await native()).getPermissionsAsync());
}

let permissionRequest: Promise<NotificationPermission> | null = null;
export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (permissionRequest) return permissionRequest;
  permissionRequest = (async () => {
    const state = await getNotificationPermission();
    if (state !== 'not_requested') return state;
    return permissionState(await (await native()).requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: false } }));
  })().finally(() => { permissionRequest = null; });
  return permissionRequest;
}

export async function openNotificationSettings() {
  if (localNotificationsSupported) await Linking.openSettings();
}

export const notificationDriver: NotificationDriver = {
  permission: getNotificationPermission,
  list: async () => localNotificationsSupported ? (await native()).getAllScheduledNotificationsAsync() : [],
  presented: async () => localNotificationsSupported ? (await (await native()).getPresentedNotificationsAsync()).map(n => n.request) : [],
  dismiss: async id => { if (localNotificationsSupported) await (await native()).dismissNotificationAsync(id); },
  cancel: async id => { if (localNotificationsSupported) await (await native()).cancelScheduledNotificationAsync(id); },
  schedule: async request => {
    if (!localNotificationsSupported) throw new Error('Local notification delivery is available on iOS');
    const api = await native();
    return api.scheduleNotificationAsync({ ...request, content: { ...request.content, sound: false }, trigger: request.trigger.type === 'date'
      ? { type: api.SchedulableTriggerInputTypes.DATE, date: request.trigger.date }
      : { type: api.SchedulableTriggerInputTypes.WEEKLY, weekday: request.trigger.weekday, hour: request.trigger.hour, minute: request.trigger.minute } });
  },
};

export const notificationReconciler = new NotificationReconciler(notificationDriver);
