import { render, screen, userEvent, waitFor, within } from '@testing-library/react-native';
import { notifyManager } from '@tanstack/react-query';

import * as commitmentApi from '@/features/commitments/commitment.api';
import type { Commitment } from '@/features/commitments/commitment.types';
import * as planningApi from '@/features/planning/planning.api';
import * as taskApi from '@/features/tasks/task.api';
import { currentWeekDates, localDateKey } from '@/features/tasks/task-dates';
import type { Task } from '@/features/tasks/task.types';
import { TodayScreen } from '@/features/today/today-screen';
import { WeekScreen } from '@/features/week/week-screen';

import { TestProviders } from '../test-utils/test-providers';

jest.mock('@react-native-community/datetimepicker', () => {
  const { Pressable, Text } = jest.requireActual('react-native');
  return function MockDateTimePicker({ mode, onChange }: { mode: string; onChange: (event: { type: string }, value: Date) => void }) {
    return (
      <Pressable accessibilityLabel={mode === 'time' ? 'בחר שעה' : 'בחר תאריך'} onPress={() => onChange({ type: 'set' }, mode === 'time' ? new Date(2026, 7, 17, 9, 30) : new Date(2026, 7, 17, 12))}>
        <Text>בחירה</Text>
      </Pressable>
    );
  };
});

jest.mock('@/features/tasks/task.api', () => ({
  cancelTask: jest.fn(), createTask: jest.fn(), listTasks: jest.fn(), updateTask: jest.fn(),
}));
jest.mock('@/features/planning/planning.api', () => ({
  getDailyPlan: jest.fn(), getWeeklyFocuses: jest.fn(), putDailyPlan: jest.fn(), replaceWeeklyFocuses: jest.fn(),
}));
jest.mock('@/features/commitments/commitment.api', () => ({
  createCommitment: jest.fn(), deleteCommitment: jest.fn(), listCommitments: jest.fn(), updateCommitment: jest.fn(),
}));

const listCommitmentsMock = jest.mocked(commitmentApi.listCommitments);
const createCommitmentMock = jest.mocked(commitmentApi.createCommitment);
const updateCommitmentMock = jest.mocked(commitmentApi.updateCommitment);
const deleteCommitmentMock = jest.mocked(commitmentApi.deleteCommitment);
const today = localDateKey();

function item(overrides: Partial<Commitment> = {}): Commitment {
  return {
    createdAt: '2026-08-15T08:00:00.000Z',
    date: today,
    description: null,
    endTime: '11:00',
    id: 'commitment-1',
    lifeArea: 'health',
    startTime: '09:30',
    title: 'תור לרופא',
    updatedAt: '2026-08-15T08:00:00.000Z',
    ...overrides,
  };
}

const task: Task = {
  completedAt: null,
  createdAt: '2026-08-15T08:00:00.000Z',
  description: null,
  dueDate: null,
  estimatedMinutes: 60,
  id: 'task-1',
  plannedDate: today,
  position: 0,
  priority: 'normal',
  status: 'open',
  title: 'משימה אמיתית',
  updatedAt: '2026-08-15T08:00:00.000Z',
  weekPlanId: null,
};

beforeAll(() => notifyManager.setScheduler((callback) => callback()));
afterAll(() => notifyManager.setScheduler((callback) => setTimeout(callback, 0)));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(taskApi.listTasks).mockImplementation(async (filters) => filters?.plannedDate ? [task] : []);
  jest.mocked(planningApi.getDailyPlan).mockResolvedValue({
    availableMinutes: 360,
    createdAt: '2026-08-15T08:00:00.000Z',
    date: today,
    focusTaskId: task.id,
    id: 'plan-1',
    updatedAt: '2026-08-15T08:00:00.000Z',
  });
  jest.mocked(planningApi.getWeeklyFocuses).mockResolvedValue([]);
});

it('renders real Today Commitments, workload, and supports create → edit → physical delete without refetches', async () => {
  let commitments = [item(), item({ endTime: null, id: 'point', startTime: '13:30', title: 'איסוף הילדים' })];
  listCommitmentsMock.mockImplementation(async (filters) => commitments.filter((commitment) => !filters?.date || commitment.date === filters.date));
  createCommitmentMock.mockImplementation(async (input) => {
    const created = item({ ...input, description: input.description ?? null, endTime: input.endTime ?? null, id: 'created', lifeArea: input.lifeArea ?? null });
    commitments = [...commitments, created];
    return created;
  });
  updateCommitmentMock.mockImplementation(async ({ id, input }) => {
    const existing = commitments.find((commitment) => commitment.id === id)!;
    const updated = { ...existing, ...input };
    commitments = commitments.map((commitment) => commitment.id === id ? updated : commitment);
    return updated;
  });
  deleteCommitmentMock.mockImplementation(async (id) => {
    const deleted = commitments.find((commitment) => commitment.id === id)!;
    commitments = commitments.filter((commitment) => commitment.id !== id);
    return deleted;
  });

  await render(<TestProviders><TodayScreen taskSource="server" /></TestProviders>);
  expect(await screen.findByText('תור לרופא')).toBeTruthy();
  expect(screen.getByText('2 התחייבויות')).toBeTruthy();
  expect(screen.getByText('2:30 / 6:00')).toBeTruthy();
  expect(screen.getByText('פנוי')).toBeTruthy();

  const user = userEvent.setup();
  await user.press(screen.getByLabelText('הוספת התחייבות'));
  await user.type(screen.getByLabelText('כותרת התחייבות'), 'פגישה חדשה');
  await user.press(screen.getByLabelText('שעת התחלה'));
  await user.press(screen.getByLabelText('בחר שעה'));
  await user.press(screen.getByLabelText('שמירת התחייבות'));
  expect(await screen.findByText('3 התחייבויות')).toBeTruthy();
  expect(createCommitmentMock.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ date: today, startTime: '09:30', title: 'פגישה חדשה' }));

  await user.press(screen.getByLabelText('עריכת התחייבות: פגישה חדשה'));
  await user.clear(screen.getByLabelText('כותרת התחייבות'));
  await user.type(screen.getByLabelText('כותרת התחייבות'), 'פגישה מעודכנת');
  await user.press(screen.getByLabelText('שמירת התחייבות'));
  expect(await screen.findByText('פגישה מעודכנת')).toBeTruthy();
  expect(updateCommitmentMock.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ id: 'created' }));

  await user.press(screen.getByLabelText('עריכת התחייבות: פגישה מעודכנת'));
  await user.press(screen.getByText('מחיקת ההתחייבות'));
  await user.press(within(screen.getByLabelText('אישור מחיקת התחייבות')).getByText('מחיקה'));
  await waitFor(() => expect(screen.queryByText('פגישה מעודכנת')).toBeNull());
  expect(deleteCommitmentMock.mock.calls[0]?.[0]).toBe('created');
  expect(listCommitmentsMock).toHaveBeenCalledTimes(1);
});

it('shows validation before sending an invalid time range', async () => {
  listCommitmentsMock.mockResolvedValue([]);
  await render(<TestProviders><TodayScreen taskSource="server" /></TestProviders>);
  const user = userEvent.setup();
  await screen.findByLabelText('הוספת התחייבות');
  await user.press(screen.getByLabelText('הוספת התחייבות'));
  await user.type(screen.getByLabelText('כותרת התחייבות'), 'טווח לא תקין');
  await user.press(screen.getByLabelText('שעת התחלה'));
  await user.press(screen.getByLabelText('בחר שעה'));
  await user.press(screen.getByLabelText('שעת סיום'));
  await user.press(screen.getByLabelText('בחר שעה'));
  await user.press(screen.getByLabelText('שמירת התחייבות'));
  expect(screen.getByText('שעת הסיום צריכה להיות אחרי שעת ההתחלה.')).toBeTruthy();
  expect(createCommitmentMock).not.toHaveBeenCalled();
});

it('uses the earliest real Week hint and prefills the selected Week day', async () => {
  const monday = localDateKey(currentWeekDates()[1]);
  listCommitmentsMock.mockResolvedValue([
    item({ date: monday, id: 'later', startTime: '14:00' }),
    item({ date: monday, id: 'earlier', startTime: '08:15', title: 'פגישה מוקדמת' }),
  ]);
  createCommitmentMock.mockImplementation(async (input) => item({ ...input, date: input.date, id: 'week-created' }));
  await render(<TestProviders><WeekScreen taskSource="server" /></TestProviders>);
  expect(await screen.findByText('08:15')).toBeTruthy();

  const user = userEvent.setup();
  await user.press(screen.getByLabelText('הוסף התחייבות ליום שני'));
  const formattedMonday = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', weekday: 'long' }).format(currentWeekDates()[1]);
  expect(within(screen.getByLabelText('תאריך התחייבות')).getByText(formattedMonday)).toBeTruthy();
  await user.type(screen.getByLabelText('כותרת התחייבות'), 'מהשבוע');
  await user.press(screen.getByLabelText('שעת התחלה'));
  await user.press(screen.getByLabelText('בחר שעה'));
  await user.press(screen.getByLabelText('שמירת התחייבות'));
  await waitFor(() => expect(createCommitmentMock.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ date: monday, title: 'מהשבוע' })));
});

it('keeps canonical preview Commitments fixture-driven', async () => {
  await render(<TestProviders><TodayScreen /></TestProviders>);
  expect(screen.getByText('איסוף הילדים')).toBeTruthy();
  expect(screen.getByText('פגישה עם דני')).toBeTruthy();
  expect(listCommitmentsMock).not.toHaveBeenCalled();
});
