import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { Platform, Pressable, Text } from 'react-native';
import { TaskDateSelection } from '@/features/tasks/task-date-selection';
import { localDateKey } from '@/features/tasks/task-dates';

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual('react-native');
  return function Picker(props: object) { return <View {...props} />; };
});

it('uses platform confirmation, preserves the calendar date, and ignores abandoned native callbacks', async () => {
  const confirm = jest.fn();
  function Harness() {
    const [open, setOpen] = useState(true);
    return <>
      <Pressable accessibilityLabel="reopen" onPress={() => setOpen(true)}><Text>open</Text></Pressable>
      {open ? <TaskDateSelection defaultDate="2026-12-31" value="2027-01-02" onCancel={() => setOpen(false)} onConfirm={(value) => { confirm(value); setOpen(false); }} /> : null}
    </>;
  }
  await render(<Harness />);
  let picker = screen.getByLabelText('תאריך לתכנון');
  expect(picker.props.mode).toBe('date');
  expect(localDateKey(picker.props.value)).toBe('2027-01-02');
  const abandoned = picker.props.onValueChange;
  await fireEvent(picker, 'dismiss');
  expect(confirm).not.toHaveBeenCalled();
  await act(() => abandoned({}, new Date(2028, 5, 2, 12)));
  expect(confirm).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByLabelText('reopen'));
  picker = screen.getByLabelText('תאריך לתכנון');
  expect(localDateKey(picker.props.value)).toBe('2027-01-02');
  await fireEvent(picker, 'valueChange', {}, new Date(2027, 1, 2, 12));
  if (Platform.OS === 'ios') {
    expect(picker.props.display).toBe('spinner');
    expect(confirm).not.toHaveBeenCalled();
    await fireEvent(screen.getByLabelText('תאריך לתכנון'), 'valueChange', {}, new Date(2028, 1, 29, 12));
    expect(confirm).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('אישור תאריך'));
    expect(confirm).toHaveBeenCalledWith('2028-02-29');
  } else {
    expect(picker.props.positiveButton).toEqual({ label: 'אישור' });
    expect(picker.props.negativeButton).toEqual({ label: 'ביטול' });
    expect(confirm).toHaveBeenCalledWith('2027-02-02');
  }
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText('תאריך לתכנון')).toBeNull();
});

it('retains the confirmed date after a failed move and allows retry without another native selection', async () => {
  const confirm = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
  await render(<TaskDateSelection defaultDate="2026-12-31" onCancel={jest.fn()} onConfirm={confirm} />);
  await fireEvent(screen.getByLabelText('תאריך לתכנון'), 'valueChange', {}, new Date(2027, 0, 2, 12));
  if (Platform.OS === 'ios') await fireEvent.press(screen.getByLabelText('אישור תאריך'));
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByLabelText('תאריך בבחירה').props.children).toBe('2027-01-02');
  await fireEvent.press(screen.getByLabelText('אישור תאריך'));
  expect(confirm.mock.calls).toEqual([['2027-01-02'], ['2027-01-02']]);
});

it('guards repeated confirmation and cancellation while a move is pending', async () => {
  let finish!: () => void;
  const confirm = jest.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
  const cancel = jest.fn();
  await render(<TaskDateSelection defaultDate="2026-12-31" onCancel={cancel} onConfirm={confirm} />);
  await fireEvent(screen.getByLabelText('תאריך לתכנון'), 'valueChange', {}, new Date(2027, 0, 2, 12));
  if (Platform.OS === 'ios') await fireEvent.press(screen.getByLabelText('אישור תאריך'));
  await fireEvent.press(screen.getByLabelText('אישור תאריך'));
  await fireEvent.press(screen.getByLabelText('ביטול בחירת תאריך'));
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(cancel).not.toHaveBeenCalled();
  await act(() => finish());
});
