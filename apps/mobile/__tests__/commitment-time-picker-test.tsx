import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { Keyboard, Platform, Text } from 'react-native';

import { CommitmentDateField, CommitmentTimeField, CommitmentTimePicker, CommitmentTimePickerProvider } from '@/features/commitments/commitment-date-time-fields.native';
import { CommitmentEditor } from '@/features/commitments/commitment-editor';
import { createCommitment, updateCommitment } from '@/features/commitments/commitment.api';
import type { Commitment } from '@/features/commitments/commitment.types';
import { apiRequest } from '@/lib/api/client';

import { TestProviders } from '../test-utils/test-providers';

// Only replace the native library boundary. Successive events exercise the real fields/editor.
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual('react-native');
  return function Picker(props: { mode: string }) {
    return <View {...props} testID={`native-${props.mode}`} />;
  };
});
jest.mock('@/lib/api/client', () => ({ apiRequest: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
});
const iosTest = Platform.OS === 'ios' ? it : it.skip;
const androidTest = Platform.OS === 'android' ? it : it.skip;

function Fields({ start = '08:05', end = null }: { start?: string; end?: string | null }) {
  const [startValue, setStart] = useState<string | null>(start);
  const [endValue, setEnd] = useState<string | null>(end);
  return (
    <CommitmentTimePickerProvider>
      <CommitmentTimeField accessibilityLabel="start" onChange={setStart} placeholder="empty" value={startValue} />
      <CommitmentTimeField accessibilityLabel="end" onChange={setEnd} optional placeholder="empty" value={endValue} />
      <CommitmentTimePicker />
      <Text testID="values">{JSON.stringify({ start: startValue, end: endValue })}</Text>
    </CommitmentTimePickerProvider>
  );
}

const press = async (label: string) => fireEvent.press(screen.getByLabelText(label));
const clock = () => screen.getByTestId('native-time');
const draftTime = () => {
  const value = clock().props.value as Date;
  return [value.getHours(), value.getMinutes()];
};
async function change(hour: number, minute: number, type = 'set') {
  await fireEvent(clock(), 'onChange', { type }, new Date(2026, 8, 7, hour, minute));
}
function values() { return JSON.parse(screen.getByTestId('values').props.children); }

iosTest('keeps successive iOS wheel changes open and commits only explicit confirmation, with exact minutes', async () => {
  const dismiss = jest.spyOn(Keyboard, 'dismiss');
  await render(<Fields />);
  await press('start');
  expect(dismiss).toHaveBeenCalled();
  expect(clock().props).toEqual(expect.objectContaining({ display: 'spinner', locale: 'en-GB', minuteInterval: 1 }));
  expect(clock().props.is24Hour).toBeUndefined();
  expect(draftTime()).toEqual([8, 5]);
  for (const minute of [10, 25, 17]) {
    await change(9, 5);
    await change(9, minute);
    expect(values().start).toBe(minute === 10 ? '08:05' : minute === 25 ? '09:10' : '09:25');
    expect(draftTime()).toEqual([9, minute]);
    await press('אישור שעה');
    expect(screen.queryByTestId('native-time')).toBeNull();
    expect(values().start).toBe(`09:${minute}`);
    await press('start');
    expect(draftTime()).toEqual([9, minute]);
  }
  dismiss.mockRestore();
});

iosTest.each([null, '10:25'])('cancels an end-time draft without changing %s and reopens from the form', async (end) => {
  await render(<Fields end={end} />);
  await press('end');
  expect(draftTime()).toEqual(end ? [10, 25] : [9, 0]);
  expect(values().end).toBe(end);
  await change(11, 17);
  await press('ביטול בחירת שעה');
  expect(values().end).toBe(end);
  await press('end');
  expect(draftTime()).toEqual(end ? [10, 25] : [9, 0]);
  await change(12, 10, 'dismissed');
  expect(values().end).toBe(end);
  expect(screen.queryByTestId('native-time')).toBeNull();
});

iosTest('isolates fields and ignores stale callbacks after switching, clearing, cancelling and reopening', async () => {
  await render(<Fields end="10:25" />);
  await press('start');
  await change(9, 17);
  const abandonedStart = clock().props.onChange;
  await press('end');
  expect(screen.getAllByTestId('native-time')).toHaveLength(1);
  expect(draftTime()).toEqual([10, 25]);
  await act(() => abandonedStart({ type: 'set' }, new Date(2026, 8, 7, 15, 17)));
  expect(draftTime()).toEqual([10, 25]);
  const abandonedEnd = clock().props.onChange;
  await press('נקה שעת סיום');
  await press('end');
  await act(() => abandonedEnd({ type: 'set' }, new Date(2026, 8, 7, 11, 17)));
  expect(draftTime()).toEqual([9, 0]);
  expect(values()).toEqual({ start: '08:05', end: null });
  await change(10, 17);
  await press('אישור שעה');
  expect(values().end).toBe('10:17');
  await press('start');
  expect(draftTime()).toEqual([8, 5]);
  const cancelled = clock().props.onChange;
  await press('ביטול בחירת שעה');
  await press('start');
  await act(() => cancelled({ type: 'set' }, new Date(2026, 8, 7, 16, 25)));
  await press('אישור שעה');
  expect(values().start).toBe('08:05');
});

androidTest('uses Android native set/dismiss without an extra confirmation surface', async () => {
  await render(<Fields />);
  await press('end');
  expect(clock().props).toEqual(expect.objectContaining({ is24Hour: true, display: 'default', minuteInterval: 1 }));
  expect(clock().props.locale).toBeUndefined();
  expect(screen.queryByLabelText('אישור שעה')).toBeNull();
  await change(9, 17, 'dismissed');
  expect(values().end).toBeNull();
  await press('end');
  const oldCallback = clock().props.onChange;
  await change(9, 17);
  expect(values().end).toBe('09:17');
  expect(screen.queryByTestId('native-time')).toBeNull();
  await press('נקה שעת סיום');
  await act(() => oldCallback({ type: 'set' }, new Date(2026, 8, 7, 9, 25)));
  expect(values().end).toBeNull();
  await press('start');
  await change(9, 10, 'dismissed');
  expect(values().start).toBe('08:05');
});

const commitment: Commitment = {
  id: 'existing', title: 'פגישה', description: 'פרטים קיימים', date: '2026-09-08',
  startTime: '08:05', endTime: null, lifeArea: 'work',
  createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
};

iosTest.each([false, true])('sends exact confirmed times through the real client (editing: %s) without changing other fields', async (editing) => {
  const close = jest.fn();
  jest.mocked(apiRequest).mockResolvedValue({ commitment });
  const save = jest.fn(async (input) => {
    if (editing) await updateCommitment({ id: commitment.id, input });
    else await createCommitment(input);
  });
  await render(<TestProviders><CommitmentEditor commitment={editing ? commitment : null} initialDate={commitment.date} onClose={close} onSave={save} visible /></TestProviders>);
  if (!editing) await fireEvent.changeText(screen.getByLabelText('כותרת התחייבות'), commitment.title);
  await press('שעת התחלה');
  await change(9, 10);
  await change(9, 25);
  await change(9, 17);
  expect(save).not.toHaveBeenCalled();
  await press('אישור שעה');
  expect(close).not.toHaveBeenCalled();
  await press('שעת סיום');
  await change(10, 25);
  await press('אישור שעה');
  await press('שמירת התחייבות');
  const expected = { title: commitment.title, date: commitment.date, startTime: '09:17', endTime: '10:25', description: editing ? commitment.description : null, lifeArea: editing ? 'work' : null };
  expect(save).toHaveBeenCalledWith(expected);
  expect(apiRequest).toHaveBeenCalledWith(editing ? '/commitments/existing' : '/commitments', expect.objectContaining({ method: editing ? 'PATCH' : 'POST' }));
  expect(JSON.parse(jest.mocked(apiRequest).mock.calls[0]![1]!.body as string)).toEqual(expected);
  expect(close).toHaveBeenCalledTimes(1);
});

iosTest.each([9, 17])('retains validation for end minute %s before/equal to start 09:17', async (minute) => {
  const save = jest.fn();
  await render(<TestProviders><CommitmentEditor commitment={{ ...commitment, startTime: '09:17' }} initialDate={commitment.date} onClose={jest.fn()} onSave={save} visible /></TestProviders>);
  await press('שעת סיום');
  await change(9, minute);
  await press('אישור שעה');
  await press('שמירת התחייבות');
  expect(screen.getByRole('alert')).toHaveTextContent('שעת הסיום צריכה להיות אחרי שעת ההתחלה.');
  expect(save).not.toHaveBeenCalled();
  await press('נקה שעת סיום');
  await press('שמירת התחייבות');
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ startTime: '09:17', endTime: null, date: commitment.date }));
});

iosTest('drops abandoned drafts when the editor hides or switches commitment identity', async () => {
  const props = { initialDate: commitment.date, onClose: jest.fn(), onSave: jest.fn() };
  const view = (visible: boolean, item = commitment) => <TestProviders><CommitmentEditor {...props} commitment={item} visible={visible} /></TestProviders>;
  const rendered = await render(view(true));
  await press('שעת התחלה');
  await change(15, 25);
  const abandoned = clock().props.onChange;
  await rendered.rerender(view(false));
  await rendered.rerender(view(true));
  await press('שעת התחלה');
  expect(draftTime()).toEqual([8, 5]);
  await act(() => abandoned({ type: 'set' }, new Date(2026, 8, 7, 16, 17)));
  expect(draftTime()).toEqual([8, 5]);
  await rendered.rerender(view(true, { ...commitment, id: 'other', startTime: '11:10' }));
  expect(screen.queryByTestId('native-time')).toBeNull();
  await press('שעת התחלה');
  expect(draftTime()).toEqual([11, 10]);
});

it('preserves the native date-field local-date selection and dismissal behavior', async () => {
  const onChange = jest.fn();
  await render(<CommitmentDateField value="2026-09-08" onChange={onChange} />);
  await press('תאריך התחייבות');
  await fireEvent(screen.getByTestId('native-date'), 'onChange', { type: 'dismissed' }, new Date(2026, 8, 10, 12));
  expect(onChange).not.toHaveBeenCalled();
  await press('תאריך התחייבות');
  await fireEvent(screen.getByTestId('native-date'), 'onChange', { type: 'set' }, new Date(2026, 8, 10, 12));
  expect(onChange).toHaveBeenCalledWith('2026-09-10');
});
