import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Keyboard, Platform } from 'react-native';

import { CommitmentEditor } from '@/features/commitments/commitment-editor';
import type { Commitment } from '@/features/commitments/commitment.types';

import { TestProviders } from '../test-utils/test-providers';

// Keep the editor, fields and picker state real; replace only the native widget.
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = jest.requireActual('react-native');
  return function Picker(props: { mode: string }) {
    return <View {...props} testID={`native-${props.mode}`} />;
  };
});

const existing: Commitment = {
  id: 'keyboard-fixture', title: 'פגישה', description: null, date: '2026-09-08',
  startTime: '09:17', endTime: '10:25', lifeArea: null,
  createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
};
const press = async (label: string) => fireEvent.press(screen.getByLabelText(label));
const title = () => screen.getByLabelText('כותרת התחייבות');
const content = () => screen.getByTestId('commitment-form-content');
const sheet = () => screen.getByLabelText('עורך התחייבות');

async function renderEditor(editing: boolean) {
  const save = jest.fn().mockResolvedValue(undefined);
  const close = jest.fn();
  const remove = jest.fn().mockResolvedValue(undefined);
  await render(<TestProviders><CommitmentEditor commitment={editing ? existing : null} initialDate={existing.date} onClose={close} onDelete={remove} onSave={save} visible /></TestProviders>);
  return { save, close, remove };
}

async function setTime(label: string, hour: number, minute: number) {
  await press(label);
  await fireEvent(screen.getByTestId('native-time'), 'onChange', { type: 'set' }, new Date(2026, 8, 8, hour, minute));
  if (Platform.OS === 'ios') await press('אישור שעה');
}

// RNTL does not perform native touch bubbling. Deliver the same target to each
// observing surface, with its own currentTarget, as React Native does.
async function touch(target: ReturnType<typeof sheet>, surfaces = [content(), sheet()]) {
  for (const currentTarget of surfaces) {
    await fireEvent(currentTarget, 'touchEnd', { target, currentTarget });
  }
}

afterEach(() => jest.restoreAllMocks());

describe.each([false, true])('commitment keyboard (editing: %s)', (editing) => {
  it('dismisses on sheet padding and form gaps without closing, saving or losing input', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const { close, save } = await renderEditor(editing);
    await fireEvent.changeText(title(), 'כותרת שנשמרת');
    await setTime('שעת התחלה', 9, 17);
    dismiss.mockClear();
    await touch(sheet(), [sheet()]);
    await touch(content());
    expect(dismiss).toHaveBeenCalledTimes(2);
    await fireEvent(sheet(), 'touchStart');
    await fireEvent(sheet(), 'touchMove');
    await touch(content()); // Scrolling owns dismissal; a drag is not a blank tap.
    expect(dismiss).toHaveBeenCalledTimes(2);
    await fireEvent(sheet(), 'touchStart');
    expect(title()).toHaveProp('value', 'כותרת שנשמרת');
    expect(screen.getByLabelText('שעת התחלה')).toHaveTextContent('09:17');
    expect(sheet().props.accessible).not.toBe(true);
    expect(content().props.accessibilityRole).toBeUndefined();
    expect(close).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    await press('שמירת התחייבות');
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ ...expectedInput(editing), title: 'כותרת שנשמרת' });
  });

  it('opens date/start/end on one press and preserves the form through cancellation and end clearing', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const { save, close } = await renderEditor(editing);
    await fireEvent.changeText(title(), 'כותרת שנשמרת');
    dismiss.mockClear();
    await press('תאריך התחייבות');
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('native-date')).toBeOnTheScreen();
    await fireEvent(screen.getByTestId('native-date'), 'onChange', { type: 'dismissed' }, new Date(2026, 8, 10));
    await setTime('שעת התחלה', 9, 17);
    await setTime('שעת סיום', 10, 25);
    await press('שעת סיום');
    const abandoned = screen.getByTestId('native-time').props.onChange;
    await touch(screen.getByTestId('native-time'));
    const beforeBlank = dismiss.mock.calls.length;
    await touch(content());
    expect(dismiss).toHaveBeenCalledTimes(beforeBlank + 1);
    expect(screen.getByTestId('native-time')).toBeOnTheScreen();
    expect(screen.getByLabelText('שעת סיום')).toHaveTextContent('10:25');
    await press('נקה שעת סיום');
    expect(screen.queryByTestId('native-time')).toBeNull();
    await act(() => abandoned({ type: 'set' }, new Date(2026, 8, 8, 11, 17)));
    await press('שעת סיום');
    await fireEvent(screen.getByTestId('native-time'), 'onChange', { type: 'dismissed' });
    expect(screen.queryByLabelText('נקה שעת סיום')).toBeNull();
    expect(save).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    await press('שמירת התחייבות');
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ ...expectedInput(editing), title: 'כותרת שנשמרת', endTime: null });
  });

  it('keeps text editing and multiline newlines independent of background dismissal; actions run once', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const { save, close } = await renderEditor(editing);
    const user = userEvent.setup();
    await fireEvent.press(screen.getByText('תיאור או תחום בחיים'));
    expect(screen.getByLabelText('תיאור התחייבות')).toBeOnTheScreen();
    expect(dismiss).toHaveBeenCalledTimes(1);
    dismiss.mockClear();
    expect(title()).toHaveProp('autoFocus', !editing);
    await user.clear(title());
    await user.type(title(), 'פגישה חדשה');
    const description = screen.getByLabelText('תיאור התחייבות');
    await touch(title());
    await touch(description);
    await user.type(description, 'שורה ראשונה\nשורה שנייה');
    expect(description).toHaveProp('multiline', true);
    expect(description.props.submitBehavior).not.toBe('blurAndSubmit');
    expect(dismiss).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'בריאות' }));
    expect(screen.getByRole('button', { name: 'בריאות', selected: true })).toBeOnTheScreen();
    expect(dismiss).toHaveBeenCalledTimes(1);
    await setTime('שעת התחלה', 9, 17);
    const scroll = screen.getByTestId('commitment-form-scroll');
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
    expect(scroll.props.keyboardDismissMode).toBe(Platform.OS === 'ios' ? 'interactive' : 'on-drag');
    await press('שמירת התחייבות');
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ ...expectedInput(editing), title: 'פגישה חדשה', description: 'שורה ראשונה\nשורה שנייה', lifeArea: 'health' });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('retains validation and explicit outside/close behavior', async () => {
    const { save, close } = await renderEditor(editing);
    await fireEvent.changeText(title(), '');
    await press('שמירת התחייבות');
    expect(screen.getByText('צריך להוסיף כותרת.')).toBeOnTheScreen();
    expect(save).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    await press('סגור עורך התחייבות');
    expect(close).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: editing ? 'סגירה' : 'ביטול' }));
    expect(close).toHaveBeenCalledTimes(2);
  });
});

function expectedInput(editing: boolean) {
  return { title: existing.title, description: null, date: existing.date, startTime: '09:17', endTime: editing ? '10:25' : null, lifeArea: null };
}

it('dismisses when requesting deletion but requires the existing confirmation and preserves cancelled edits', async () => {
  const dismiss = jest.spyOn(Keyboard, 'dismiss');
  const { remove, save, close } = await renderEditor(true);
  await fireEvent.changeText(title(), 'טיוטה');
  await fireEvent.press(screen.getByText('מחיקת ההתחייבות'));
  expect(dismiss).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('אישור מחיקת התחייבות')).toBeOnTheScreen();
  expect(remove).not.toHaveBeenCalled();
  await press('ביטול מחיקה');
  expect(title()).toHaveProp('value', 'טיוטה');
  await fireEvent.press(screen.getByText('מחיקת ההתחייבות'));
  await fireEvent.press(screen.getByRole('button', { name: 'מחיקה' }));
  expect(remove).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledWith(existing.id);
  expect(save).not.toHaveBeenCalled();
  expect(close).toHaveBeenCalledTimes(1);
});
