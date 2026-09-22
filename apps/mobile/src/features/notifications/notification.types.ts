import type { Commitment } from '@/features/commitments/commitment.types';
import type { Task } from '@/features/tasks/task.types';

export type NotificationPreferences = {
  enabled: boolean;
  taskRemindersEnabled: boolean;
  commitmentRemindersEnabled: boolean;
  commitmentDefaultReminderMinutes: number;
  weeklyPlanningEnabled: boolean;
  weeklyPlanningWeekday: number | null;
  weeklyPlanningTime: string | null;
};
export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: false, taskRemindersEnabled: false, weeklyPlanningEnabled: false,
  commitmentRemindersEnabled: false, commitmentDefaultReminderMinutes: 15,
  weeklyPlanningWeekday: null, weeklyPlanningTime: null,
};
export type NotificationPermission = 'not_requested' | 'allowed' | 'denied' | 'unavailable';
export type NotificationData = { owner: 'lifeos'; userId: string; kind: 'task' | 'weekly' | 'commitment'; taskId?: string; commitmentId?: string };
export type LocalRequest = { identifier: string; content: { title?: string | null; body?: string | null; data?: Record<string, unknown> | null } };
export type DesiredNotification = LocalRequest & {
  content: { title: string; body: string; data: NotificationData };
  trigger: { type: 'date'; date: Date } | { type: 'weekly'; weekday: number; hour: number; minute: number };
};
export type NotificationSnapshot = { preferences: NotificationPreferences; tasks: Task[]; commitments?: Commitment[] };
export type ReconciliationResult = { scheduled: number; deferred: number };
export type NotificationDriver = {
  permission(): Promise<NotificationPermission>;
  list(): Promise<LocalRequest[]>;
  schedule(request: DesiredNotification): Promise<string>;
  cancel(identifier: string): Promise<void>;
  presented(): Promise<LocalRequest[]>;
  dismiss(identifier: string): Promise<void>;
};

export function notificationData(data: Record<string, unknown> | null | undefined): NotificationData | null {
  if (data?.owner !== 'lifeos' || typeof data.userId !== 'string') return null;
  if (data.kind === 'weekly') return { owner: 'lifeos', userId: data.userId, kind: 'weekly' };
  if (data.kind === 'task' && typeof data.taskId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.taskId)) {
    return { owner: 'lifeos', userId: data.userId, kind: 'task', taskId: data.taskId };
  }
  if (data.kind === 'commitment' && typeof data.commitmentId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.commitmentId)) {
    return { owner: 'lifeos', userId: data.userId, kind: 'commitment', commitmentId: data.commitmentId };
  }
  return null;
}
