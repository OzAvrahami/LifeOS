/** @jest-environment jsdom */
import { act, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskReminderEditor } from '@/features/notifications/task-reminder-editor';
import { reminderLocalParts } from '@/features/notifications/reminder-time';
import { getNotificationPermission } from '@/features/notifications/notification.service';

jest.mock('react-native', () => ({ ...jest.requireActual('react-native-web'), TurboModuleRegistry: jest.requireActual('react-native').TurboModuleRegistry }));
jest.mock('@/features/commitments/commitment-date-time-fields', () => jest.requireActual('@/features/commitments/commitment-date-time-fields.web'));
jest.mock('@/features/tasks/task-date-control', () => jest.requireActual('@/features/tasks/task-date-control.web'));
jest.mock('@/features/notifications/notification-module', () => jest.requireActual('@/features/notifications/notification-module.ts'));
jest.mock('@/features/settings/settings.api', () => ({ getSettings: jest.fn(async () => ({ persisted: false, timezone: null, weekStartDay: 0, defaultDailyCapacityMinutes: 360 })) }));
const { createRoot } = jest.requireActual<{ createRoot: (container: Element) => { render: (node: ReactNode) => void; unmount: () => void } }>('react-dom/client');

it('keeps browser input focus and exact-minute validity, persists/reopens local values and never requests native delivery', async () => {
  const container = document.createElement('div'); document.body.appendChild(container);
  const root = createRoot(container);
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  const env = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
  const previous = env.IS_REACT_ACT_ENVIRONMENT; env.IS_REACT_ACT_ENVIRONMENT = true;
  const save = jest.fn(async (_value: string | null) => {});
  const close = jest.fn();
  const input = (label: string) => container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
  const button = (label: string) => container.querySelector<HTMLElement>(`[role="button"][aria-label="${label}"]`)!;
  const tree = (key: string, value: string | null) => <QueryClientProvider client={client}><TaskReminderEditor key={key} value={value} onSave={save} onCancel={close} /></QueryClientProvider>;
  const change = async (node: HTMLInputElement, value: string) => act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(node, value);
    node.dispatchEvent(new Event('input', { bubbles: true }));
  });
  try {
    await act(() => root.render(tree('initial', new Date(2099, 0, 5, 9, 10).toISOString())));
    const time = input('שעת תזכורת');
    expect(time.type).toBe('time'); expect(time.step).toBe('60'); expect(time.dir).toBe('ltr');
    await act(() => time.focus()); expect(document.activeElement).toBe(time);
    for (const exact of ['09:10', '09:25', '09:17']) {
      await change(time, exact); expect(time.value).toBe(exact); expect(time.checkValidity()).toBe(true);
      expect(document.activeElement).toBe(time);
    }
    await act(() => button('תאריך תזכורת: 2099-01-05').click());
    const date = input('תאריך תזכורת'); expect(date.type).toBe('date'); expect(document.activeElement).toBe(date);
    await change(date, '2099-01-07'); await act(() => button('אישור תאריך').click());
    await act(async () => button('שמירת תזכורת').click());
    expect(save).toHaveBeenCalledTimes(1);
    const instant = save.mock.calls[0][0]!;
    expect(reminderLocalParts(instant)).toEqual({ date: '2099-01-07', time: '09:17' });
    await act(() => root.render(tree('reopen', instant)));
    expect(input('שעת תזכורת').value).toBe('09:17');
    await act(() => button('ניקוי תזכורת').click());
    await act(async () => button('שמירת תזכורת').click());
    expect(save).toHaveBeenLastCalledWith(null); expect(await getNotificationPermission()).toBe('unavailable');
  } finally {
    await act(() => root.unmount()); client.clear(); container.remove(); env.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});
