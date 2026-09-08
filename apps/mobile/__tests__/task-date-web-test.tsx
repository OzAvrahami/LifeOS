/** @jest-environment jsdom */
import { act, type ReactNode } from 'react';
import { Keyboard } from 'react-native';
import { QuickCaptureSheet } from '@/features/capture/quick-capture-sheet';

jest.mock('react-native', () => ({ ...jest.requireActual('react-native-web'), TurboModuleRegistry: jest.requireActual('react-native').TurboModuleRegistry }));
jest.mock('@/features/tasks/task-date-control', () => jest.requireActual('@/features/tasks/task-date-control.web'));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }) }));
const { createRoot } = jest.requireActual<{
  createRoot: (container: Element) => { render: (node: ReactNode) => void; unmount: () => void };
}>('react-dom/client');

it('preserves browser date/focus/keyboard behavior, validates empty or malformed dates, and confirms/cancels exact dates', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const save = jest.fn().mockResolvedValue(undefined);
  const close = jest.fn();
  const dismiss = jest.spyOn(Keyboard, 'dismiss');
  const env = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
  const previous = env.IS_REACT_ACT_ENVIRONMENT;
  env.IS_REACT_ACT_ENVIRONMENT = true;
  const input = (label: string) => document.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
  const button = (name: string) => [...document.querySelectorAll<HTMLElement>('[role="button"]')].find((node) => node.textContent === name || node.getAttribute('aria-label') === name)!;
  async function change(node: HTMLInputElement, value: string) {
    await act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(node, value);
      node.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  try {
    await act(() => root.render(<QuickCaptureSheet defaultDate="2026-12-31" onSave={save} onClose={close} visible />));
    const title = input('כותרת');
    await change(title, 'browser date');
    await act(() => button('בחר יום').click());
    let date = input('תאריך לתכנון');
    expect(date.type).toBe('date');
    expect(date.value).toBe('2026-12-31');
    expect(document.activeElement).toBe(date);
    expect(date.dir).toBe('ltr');
    expect(date.tabIndex).toBeGreaterThanOrEqual(0);
    await change(date, '2027-01-02');
    await act(() => button('ביטול בחירת תאריך').click());
    expect(title.value).toBe('browser date');
    expect(save).not.toHaveBeenCalled();
    await act(() => button('בחר יום').click());
    date = input('תאריך לתכנון');
    expect(date.value).toBe('2026-12-31');
    for (const invalid of ['', '2027-02-29', 'malformed']) {
      await change(date, '2027-01-02');
      await change(date, invalid);
      expect(date.value).toBe(''); // HTML date input sanitizes malformed calendar values.
      expect(document.querySelector('[role="alert"]')?.textContent).toBe('יש לבחור תאריך תקין.');
      await act(() => { button('אישור תאריך').click(); button('שמירה').click(); });
      await act(() => title.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
      expect(save).not.toHaveBeenCalled();
      expect(close).not.toHaveBeenCalled();
    }
    await change(date, '2027-01-02');
    for (const control of [date, button('אישור תאריך'), button('ביטול בחירת תאריך'), title]) {
      await act(() => control.focus());
      expect(document.activeElement).toBe(control);
      expect(control.tabIndex).toBeGreaterThanOrEqual(0);
    }
    await act(() => { title.focus(); title.setSelectionRange(1, 5); });
    expect([title.selectionStart, title.selectionEnd]).toEqual([1, 5]);
    await act(() => button('אישור תאריך').click());
    expect(document.querySelector('[aria-label="תאריך המשימה"]')?.textContent).toBe('2027-01-02');
    await act(() => button('בחר יום').click());
    date = input('תאריך לתכנון');
    expect(date.value).toBe('2027-01-02');
    await change(date, '2028-02-29');
    await act(() => button('ביטול בחירת תאריך').click());
    expect(document.querySelector('[aria-label="תאריך המשימה"]')?.textContent).toBe('2027-01-02');
    await act(async () => { button('שמירה').click(); });
    expect(save.mock.calls).toEqual([['browser date', { destination: 'day', plannedDate: '2027-01-02' }]]);
    expect(close).toHaveBeenCalledTimes(1);
    expect(dismiss).not.toHaveBeenCalled();
  } finally {
    await act(() => root.unmount());
    container.remove();
    dismiss.mockRestore();
    env.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});
