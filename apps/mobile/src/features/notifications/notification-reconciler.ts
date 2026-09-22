import { commitmentReminderInstant } from './commitment-reminder-time';
import { defaultNotificationPreferences, type DesiredNotification, type NotificationDriver, type NotificationSnapshot, type ReconciliationResult } from './notification.types';

export function desiredNotifications(userId: string, { preferences: p, tasks, commitments = [] }: NotificationSnapshot, now: number): DesiredNotification[] {
  if (!p.enabled) return [];
  const desired: DesiredNotification[] = [];
  if (p.weeklyPlanningEnabled && p.weeklyPlanningWeekday !== null && p.weeklyPlanningTime) {
    const [hour, minute] = p.weeklyPlanningTime.split(':').map(Number);
    desired.push({
      identifier: `lifeos:${userId}:weekly:${p.weeklyPlanningWeekday}:${p.weeklyPlanningTime}`,
      content: { title: 'תכנון השבוע', body: 'כמה דקות לתכנון השבוע יעזרו לך להחליט מה באמת חשוב.', data: { owner: 'lifeos', userId, kind: 'weekly' } },
      // Expo Notifications 57.0.12: Sunday = 1. No timezone: device wall clock.
      trigger: { type: 'weekly', weekday: p.weeklyPlanningWeekday + 1, hour: hour!, minute: minute! },
    });
  }
  if (p.taskRemindersEnabled) {
    for (const task of [...tasks].sort((a, b) => (Date.parse(a.reminderAt ?? '') - Date.parse(b.reminderAt ?? '')) || a.id.localeCompare(b.id))) {
      const instant = task.reminderAt ? Date.parse(task.reminderAt) : NaN;
      if (!['open', 'in_progress'].includes(task.status) || !Number.isFinite(instant) || instant <= now) continue;
      desired.push({ identifier: `lifeos:${userId}:task:${task.id}:${instant}`,
        content: { title: 'תזכורת למשימה', body: task.title, data: { owner: 'lifeos', userId, kind: 'task', taskId: task.id } },
        trigger: { type: 'date', date: new Date(instant) } });
    }
  }
  if (p.commitmentRemindersEnabled) {
    for (const commitment of commitments) {
      const instant = commitmentReminderInstant(commitment);
      if (instant === null || instant <= now) continue;
      desired.push({ identifier: `lifeos:${userId}:commitment:${commitment.id}:${instant}`,
        content: { title: 'תזכורת להתחייבות', body: commitment.title, data: { owner: 'lifeos', userId, kind: 'commitment', commitmentId: commitment.id } },
        trigger: { type: 'date', date: new Date(instant) } });
    }
  }
  // Reserve weekly first, then select nearest one-time reminders across kinds.
  return desired.sort((a, b) => {
    if (a.trigger.type === 'weekly') return b.trigger.type === 'weekly' ? 0 : -1;
    if (b.trigger.type === 'weekly') return 1;
    return a.trigger.date.getTime() - b.trigger.date.getTime() || a.identifier.localeCompare(b.identifier);
  });
}

// Only device operations are serialized. Slow/offline account fetches must never
// hold up logout cleanup. Superseded snapshots cannot apply after newer requests.
export class NotificationReconciler {
  private revision = 0;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly driver: NotificationDriver, private readonly now = Date.now) {}

  private serial<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.queue.then(operation);
    this.queue = next.catch(() => undefined);
    return next;
  }

  async reconcile(userId: string | null, load: () => Promise<NotificationSnapshot>): Promise<ReconciliationResult | null> {
    const revision = ++this.revision;
    const current = () => revision === this.revision;
    await this.serial(async () => {
      for (const item of await this.driver.list()) {
        if (!current()) return;
        if (item.content.data?.owner === 'lifeos' && (!userId || item.content.data.userId !== userId)) await this.driver.cancel(item.identifier);
      }
      for (const item of await this.driver.presented()) {
        if (!current()) return;
        if (item.content.data?.owner === 'lifeos' && (!userId || item.content.data.userId !== userId)) await this.driver.dismiss(item.identifier);
      }
    });
    if (!current()) return null;
    if (!userId) return { scheduled: 0, deferred: 0 };
    const permission = await this.driver.permission();
    const snapshot = permission === 'allowed' ? await load() : { preferences: defaultNotificationPreferences, tasks: [] };
    if (!current()) return null;
    return this.serial(async () => {
      const existing = await this.driver.list();
      if (!current()) return null;
      const desired = desiredNotifications(userId, snapshot, this.now());
      // Reserve room for unrelated requests and the weekly reminder. Remaining
      // future one-time reminders refill on reconciliation; never pretend overflow is queued.
      const capacity = Math.max(0, 64 - existing.filter(item => item.content.data?.owner !== 'lifeos').length);
      const selected = desired.slice(0, capacity);
      const byId = new Map(selected.map(item => [item.identifier, item]));
      const retained = new Set<string>();
      for (const item of existing) {
        if (!current()) return null;
        if (item.content.data?.owner !== 'lifeos') continue;
        const wanted = byId.get(item.identifier);
        if (wanted && !retained.has(item.identifier) && wanted.content.body === item.content.body && wanted.content.title === item.content.title
          && item.content.data.userId === userId && item.content.data.kind === wanted.content.data.kind && item.content.data.taskId === wanted.content.data.taskId && item.content.data.commitmentId === wanted.content.data.commitmentId) {
          retained.add(item.identifier);
        } else await this.driver.cancel(item.identifier);
      }
      for (const item of selected) {
        if (!current()) return null;
        if (retained.has(item.identifier)) continue;
        if (item.trigger.type === 'date' && item.trigger.date.getTime() <= this.now()) continue;
        const identifier = await this.driver.schedule(item);
        if (!current()) { await this.driver.cancel(identifier); return null; }
        retained.add(item.identifier);
      }
      return { scheduled: retained.size, deferred: desired.length - selected.length };
    });
  }
}
