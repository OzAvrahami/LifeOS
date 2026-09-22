import { fireEvent, render, screen } from '@testing-library/react-native';
import * as taskApi from '@/features/tasks/task.api';
import * as settingsApi from '@/features/settings/settings.api';
import * as planningApi from '@/features/planning/planning.api';
import * as commitmentApi from '@/features/commitments/commitment.api';
import { TodayScreen } from '@/features/today/today-screen';
import { InboxScreen } from '@/features/inbox/inbox-screen';
import { WeekScreen } from '@/features/week/week-screen';
import { localDateKey } from '@/features/tasks/task-dates';
import type { Task } from '@/features/tasks/task.types';
import { defaultNotificationPreferences } from '@/features/notifications/notification.types';
import { TestProviders } from '../test-utils/test-providers';

jest.mock('@/features/tasks/task.api', () => ({ listTasks: jest.fn(), updateTask: jest.fn(), cancelTask: jest.fn(), createTask: jest.fn() }));
jest.mock('@/features/settings/settings.api', () => ({ getSettings: jest.fn() }));
jest.mock('@/features/planning/planning.api', () => ({ getDailyPlan: jest.fn(), putDailyPlan: jest.fn(), getWeeklyFocuses: jest.fn(), replaceWeeklyFocuses: jest.fn(), getWeeklyPlan: jest.fn(), saveWeeklyPlan: jest.fn() }));
jest.mock('@/features/commitments/commitment.api', () => ({ listCommitments: jest.fn(), createCommitment: jest.fn(), updateCommitment: jest.fn(), deleteCommitment: jest.fn() }));
jest.mock('expo-notifications', () => ({}));
const id = '11111111-1111-4111-8111-111111111111';
const date = localDateKey(undefined, 'UTC');
let item: Task;
beforeEach(() => {
  jest.clearAllMocks();
  item = { id, title: 'משימה אמיתית', description: null, plannedDate: date, dueDate: null, reminderAt: '2099-01-02T09:17:00Z', estimatedMinutes: 15, status: 'open', priority: 'normal', position: 0, weekPlanId: null, completedAt: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
  jest.mocked(taskApi.listTasks).mockImplementation(async (filters = {}) => filters.weekStart ? [] : [item]);
  jest.mocked(settingsApi.getSettings).mockResolvedValue({ persisted: true, timezone: 'UTC', weekStartDay: 0, defaultDailyCapacityMinutes: 360, notifications: defaultNotificationPreferences });
  jest.mocked(planningApi.getDailyPlan).mockResolvedValue(null);
  jest.mocked(planningApi.getWeeklyFocuses).mockResolvedValue([]);
  jest.mocked(planningApi.getWeeklyPlan).mockResolvedValue({ weekPlan: null, focuses: [] });
  jest.mocked(commitmentApi.listCommitments).mockResolvedValue([]);
});
const press = async (label: string) => fireEvent.press(await screen.findByLabelText(label));
async function expectSharedReminder() {
  await screen.findByLabelText('פרטי משימה');
  expect(screen.getByLabelText('הזכר לי')).toBeTruthy();
  expect(screen.getByText(/^תזכורת:/)).toBeTruthy();
  expect(screen.getByLabelText('עריכת כותרת')).toBeTruthy();
  expect(screen.getByLabelText('שינוי תאריך המשימה')).toBeTruthy();
  await press('הזכר לי');
  await screen.findByLabelText('עריכת תזכורת');
  expect(screen.getByLabelText('שעת תזכורת')).toBeTruthy();
  expect(taskApi.updateTask).not.toHaveBeenCalled();
}

it.each(['open', 'in_progress', 'completed'] as const)('Today exposes shared details for %s tasks without activating/completing them', async status => {
  item.status = status;
  await render(<TestProviders><TodayScreen taskSource="server" /></TestProviders>);
  await press(`פרטי משימה ותזכורת: ${item.title}`);
  await expectSharedReminder();
});

it('Week/day uses the same details/reminder semantics and retains its selected date', async () => {
  await render(<TestProviders><WeekScreen taskSource="server" /></TestProviders>);
  await press(`פתח יום ${date}`); await press(`פתח משימה: ${item.title}`);
  await expectSharedReminder();
});

it('Inbox actions expose shared task details with the same reminder value', async () => {
  item.plannedDate = null;
  await render(<TestProviders><InboxScreen taskSource="server" /></TestProviders>);
  await press(`פריט Inbox: ${item.title}`);
  await fireEvent.press(screen.getByRole('button', { name: 'פרטי משימה' }));
  await expectSharedReminder();
});


it('Week-only unscheduled tasks expose shared details without first assigning a day', async () => {
  item.plannedDate = null; item.weekPlanId = 'existing-week';
  jest.mocked(taskApi.listTasks).mockImplementation(async (filters = {}) => filters.weekStart ? [item] : []);
  await render(<TestProviders><WeekScreen taskSource="server" /></TestProviders>);
  await press(`פרטי משימה ותזכורת: ${item.title}`);
  await expectSharedReminder();
});
