import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';
import { useDemoTasks } from '@/features/tasks/demo-task-provider';
import type { CaptureDestination, TaskCapturePlacement } from '@/features/tasks/task-capture.types';
import { isPlanningDate, localDateKey } from '@/features/tasks/task-dates';
import * as taskApi from '@/features/tasks/task.api';
import type { Task, TaskSource } from '@/features/tasks/task.types';
import { useTaskCapture } from '@/features/tasks/use-task-capture';
import { TestProviders } from '../test-utils/test-providers';

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual('react-native');
  return function Picker(props: object) { return <View {...props} />; };
});
jest.mock('@/features/tasks/task.api', () => ({ createTask: jest.fn(), listTasks: jest.fn(), updateTask: jest.fn(), cancelTask: jest.fn() }));
jest.mock('@/features/settings/settings.queries', () => ({
  useEffectiveSettings: () => ({ effective: { timezone: 'America/Los_Angeles', weekStartDay: 1 } }),
}));

const create = jest.mocked(taskApi.createTask);
const record: Task = { id: 'isolated-date-task', title: 'משימה', description: 'retained', dueDate: '2027-06-01', estimatedMinutes: 45, priority: 'important', plannedDate: null, weekPlanId: null, position: 2, status: 'open', completedAt: null, createdAt: '2026-12-31T00:00:00Z', updatedAt: '2026-12-31T00:00:00Z' };

function Capture({ source = 'server', initial = 'inbox' }: { source?: TaskSource; initial?: CaptureDestination }) {
  const { captureTask, defaultDate } = useTaskCapture(source);
  const demo = useDemoTasks();
  const [open, setOpen] = useState(true);
  return <>
    <Pressable accessibilityLabel="open" onPress={() => setOpen(true)}><Text>open</Text></Pressable>
    <Text testID="demo-data">{JSON.stringify(demo.tasks)}</Text>
    <QuickCaptureSheet defaultDate={defaultDate} initialDestination={initial} onSave={captureTask} onClose={() => setOpen(false)} visible={open} />
  </>;
}

async function choose(date: Date) {
  await fireEvent.press(screen.getByText('בחר יום'));
  await fireEvent(screen.getByLabelText('תאריך לתכנון'), 'valueChange', {}, date);
  await fireEvent.press(screen.getByLabelText('אישור תאריך'));
}

beforeEach(() => {
  create.mockReset().mockImplementation(async (input) => ({ ...record, title: input.title, plannedDate: input.planning?.type === 'day' ? input.planning.plannedDate : null }));
  // Only replace Date: real timers continue to drive React Query and user events.
  jest.useFakeTimers({ doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'queueMicrotask', 'nextTick', 'performance'] });
  jest.setSystemTime(new Date('2027-01-01T00:30:00Z'));
});
afterEach(() => { jest.useRealTimers(); });

it('selects a year-boundary date, displays it before saving, and sends exact planning to the real mutation hook', async () => {
  await render(<TestProviders><Capture /></TestProviders>);
  await fireEvent.changeText(screen.getByLabelText('כותרת'), ' משימה ');
  await choose(new Date(2027, 0, 2, 12));
  expect(screen.getByLabelText('תאריך המשימה').props.children).toBe('2027-01-02');
  expect(create).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('שמירה'));
  expect(create).toHaveBeenCalledTimes(1);
  expect(create).toHaveBeenCalledWith({ title: 'משימה', planning: { type: 'day', plannedDate: '2027-01-02' } }, expect.anything());
  expect(screen.queryByLabelText('חלונית הוספה מהירה')).toBeNull();
});

it('cancels first selection and later changes, reopens from committed value and isolates new sessions', async () => {
  await render(<TestProviders><Capture initial="week" /></TestProviders>);
  await fireEvent.changeText(screen.getByLabelText('כותרת'), 'טיוטה');
  await fireEvent.press(screen.getByText('בחר יום'));
  const picker = screen.getByLabelText('תאריך לתכנון');
  expect(localDateKey(picker.props.value)).toBe('2026-12-31');
  await fireEvent(picker, 'valueChange', {}, new Date(2027, 5, 1, 12));
  await fireEvent.press(screen.getByLabelText('ביטול בחירת תאריך'));
  expect(screen.getByText('השבוע').parent?.props.accessibilityState.selected).toBe(true);
  expect(screen.getByLabelText('כותרת').props.value).toBe('טיוטה');
  await choose(new Date(2027, 0, 2, 12));
  await fireEvent.press(screen.getByText('בחר יום'));
  expect(localDateKey(screen.getByLabelText('תאריך לתכנון').props.value)).toBe('2027-01-02');
  await fireEvent(screen.getByLabelText('תאריך לתכנון'), 'valueChange', {}, new Date(2028, 6, 4, 12));
  await fireEvent.press(screen.getByLabelText('ביטול בחירת תאריך'));
  expect(screen.getByLabelText('תאריך המשימה').props.children).toBe('2027-01-02');
  await fireEvent.press(screen.getByText('בחר יום'));
  expect(localDateKey(screen.getByLabelText('תאריך לתכנון').props.value)).toBe('2027-01-02');
  await fireEvent.press(screen.getByLabelText('סגור הוספה מהירה'));
  await fireEvent.press(screen.getByLabelText('open'));
  expect(screen.getByLabelText('כותרת').props.value).toBe('');
  expect(screen.getByText('השבוע').parent?.props.accessibilityState.selected).toBe(true);
  await fireEvent.press(screen.getByText('בחר יום'));
  expect(localDateKey(screen.getByLabelText('תאריך לתכנון').props.value)).toBe('2026-12-31');
  expect(create).not.toHaveBeenCalled();
});

it('blocks Save and keyboard submission until a day is explicitly confirmed', async () => {
  await render(<TestProviders><Capture initial="day" /></TestProviders>);
  await fireEvent.changeText(screen.getByLabelText('כותרת'), 'טיוטה');
  await fireEvent.press(screen.getByText('שמירה'));
  await fireEvent(screen.getByLabelText('כותרת'), 'submitEditing');
  await fireEvent.press(screen.getByText('בחר יום'));
  await fireEvent(screen.getByLabelText('כותרת'), 'submitEditing');
  await fireEvent.press(screen.getByLabelText('ביטול בחירת תאריך'));
  await fireEvent(screen.getByLabelText('כותרת'), 'submitEditing');
  expect(create).not.toHaveBeenCalled();
  expect(screen.getByLabelText('חלונית הוספה מהירה')).toBeTruthy();
});

it.each([
  ['Inbox', undefined],
  ['היום', { type: 'day', plannedDate: '2026-12-31' }],
  ['השבוע', { type: 'week', weekStart: '2026-12-28' }],
])('switches from a custom date to %s without carrying it into the request', async (label, planning) => {
  await render(<TestProviders><Capture /></TestProviders>);
  await choose(new Date(2028, 1, 29, 12));
  await fireEvent.press(screen.getByText(label as string));
  await fireEvent.changeText(screen.getByLabelText('כותרת'), 'משימה');
  await fireEvent(screen.getByLabelText('כותרת'), 'submitEditing');
  expect(create.mock.calls[0]?.[0]).toEqual({ title: 'משימה', ...(planning ? { planning } : {}) });
});

it('preserves failed input, guards pending repeated keyboard/Save/close actions, then retries successfully', async () => {
  let reject!: (reason: Error) => void;
  create.mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }));
  await render(<TestProviders><Capture /></TestProviders>);
  await fireEvent.changeText(screen.getByLabelText('כותרת'), 'טיוטה');
  await choose(new Date(2027, 0, 2, 12));
  await fireEvent(screen.getByLabelText('כותרת'), 'submitEditing');
  await fireEvent(screen.getByLabelText('כותרת'), 'submitEditing');
  await fireEvent.press(screen.getByText('שומר…'));
  await fireEvent.press(screen.getByLabelText('סגור הוספה מהירה'));
  expect(create).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('חלונית הוספה מהירה')).toBeTruthy();
  await act(() => reject(new Error('offline')));
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByLabelText('כותרת').props.value).toBe('טיוטה');
  expect(screen.getByLabelText('תאריך המשימה').props.children).toBe('2027-01-02');
  await userEvent.setup().press(screen.getByText('שמירה'));
  expect(create).toHaveBeenCalledTimes(2);
  expect(screen.queryByLabelText('חלונית הוספה מהירה')).toBeNull();
});

it('captures a custom date only in the demo provider', async () => {
  await render(<TestProviders><Capture source="preview" /></TestProviders>);
  await fireEvent.changeText(screen.getByLabelText('כותרת'), 'preview date');
  await choose(new Date(2027, 0, 2, 12));
  await fireEvent.press(screen.getByText('שמירה'));
  const tasks = JSON.parse(screen.getByTestId('demo-data').props.children);
  expect(tasks.filter((task: Task) => task.title === 'preview date')).toEqual([expect.objectContaining({ plannedDate: '2027-01-02', weekPlanId: null })]);
  expect(create).not.toHaveBeenCalled();
});

it.each(['', '2027-02-29', '2027-13-01', '2027-01-01T00:00:00Z', 'not-a-date'])('rejects invalid date %s at the hook boundary', async (plannedDate) => {
  let capture!: (title: string, placement: TaskCapturePlacement) => Promise<void>;
  function Probe() { capture = useTaskCapture('server').captureTask; return null; }
  await render(<TestProviders><Probe /></TestProviders>);
  await expect(capture('invalid', { destination: 'day', plannedDate })).rejects.toThrow('valid planning date');
  expect(isPlanningDate(plannedDate)).toBe(false);
  expect(create).not.toHaveBeenCalled();
});
