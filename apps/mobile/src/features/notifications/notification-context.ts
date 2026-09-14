import { createContext, useContext } from 'react';
import type { NotificationPermission, ReconciliationResult } from './notification.types';

type NotificationContextValue = {
  permission: NotificationPermission;
  error: boolean;
  result: ReconciliationResult | null;
  reconcile: () => Promise<void>;
  requestPermission: () => Promise<void>;
};
const fallback: NotificationContextValue = { permission: 'unavailable', error: false, result: null, reconcile: async () => {}, requestPermission: async () => {} };
export const NotificationContext = createContext<NotificationContextValue>(fallback);
export const useNotifications = () => useContext(NotificationContext);
