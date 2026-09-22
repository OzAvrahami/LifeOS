import { notificationData, type LocalRequest } from './notification.types';

export function notificationDestination(request: LocalRequest, userId: string | null) {
  const data = notificationData(request.content.data);
  if (!data || !userId || data.userId !== userId) return null;
  return data.kind === 'weekly' ? { pathname: '/week' as const }
    : data.kind === 'commitment' ? { pathname: '/commitment' as const, params: { id: data.commitmentId! } }
    : { pathname: '/task' as const, params: { id: data.taskId! } };
}

export class NotificationResponseRouter {
  private handled = new Set<string>();
  consume(request: LocalRequest, deliveredAt: number, userId: string | null) {
    const key = `${request.identifier}:${deliveredAt}`;
    if (this.handled.has(key)) return null;
    this.handled.add(key);
    return notificationDestination(request, userId);
  }
}
