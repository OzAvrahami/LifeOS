/** @jest-environment jsdom */

import { act, type ReactNode } from 'react';
import { Keyboard } from 'react-native';

import { CommitmentEditor } from '@/features/commitments/commitment-editor';
import type { Commitment } from '@/features/commitments/commitment.types';

// Exercise the actual editor with React Native Web and browser date/time inputs.
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native-web'),
  // The suite's native Expo preset also installs lazy native fetch/logging
  // polyfills. Retain its registry for that test environment infrastructure.
  TurboModuleRegistry: jest.requireActual('react-native').TurboModuleRegistry,
}));
jest.mock('@/features/commitments/commitment-date-time-fields', () => jest.requireActual('@/features/commitments/commitment-date-time-fields.web'));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const { createRoot } = jest.requireActual<{
  createRoot: (container: Element) => { render: (node: ReactNode) => void; unmount: () => void };
}>('react-dom/client');

const existing: Commitment = {
  id: 'web-keyboard-fixture', title: 'פגישה', description: 'תיאור קודם', date: '2026-09-08',
  startTime: '09:17', endTime: '10:25', lifeArea: 'work',
  createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
};

it.each([false, true])('preserves Web text/date/time focus, multiline editing and one-click actions (editing: %s)', async (editing) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const save = jest.fn().mockResolvedValue(undefined);
  const close = jest.fn();
  const dismiss = jest.spyOn(Keyboard, 'dismiss');
  const actEnvironment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
  const previous = actEnvironment.IS_REACT_ACT_ENVIRONMENT;
  actEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  const input = (label: string) => document.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
  const button = (name: string) => [...document.querySelectorAll<HTMLElement>('[role="button"]')].find((node) => node.textContent === name)!;
  async function change(node: HTMLInputElement | HTMLTextAreaElement, value: string) {
    const prototype = node instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    await act(() => {
      Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(node, value);
      node.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
  try {
    await act(() => root.render(<CommitmentEditor commitment={editing ? existing : null} initialDate={existing.date} onClose={close} onSave={save} visible />));
    const title = input('כותרת התחייבות');
    await act(() => title.focus());
    await change(title, 'פגישה חדשה');
    await act(() => {
      const background = document.querySelector('[data-testid="commitment-form-content"]')!;
      const touch: Touch = { identifier: 1, target: background, clientX: 1, clientY: 1, pageX: 1, pageY: 1, screenX: 1, screenY: 1, force: 0, radiusX: 1, radiusY: 1, rotationAngle: 0 };
      background.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [touch], changedTouches: [touch] }));
      background.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [touch] }));
    });
    expect(document.activeElement).toBe(title);
    expect(save).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    if (!editing) await act(() => button('תיאור או תחום בחיים').click());
    const description = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="תיאור התחייבות"]')!;
    await act(() => description.focus());
    expect(document.activeElement).toBe(description);
    await change(description, 'שורה ראשונה\nשורה שנייה');
    await act(() => { title.focus(); title.setSelectionRange(1, 4); title.click(); });
    expect(document.activeElement).toBe(title);
    expect([title.selectionStart, title.selectionEnd]).toEqual([1, 4]);
    const date = input('תאריך ההתחייבות');
    const start = input('שעת התחלה');
    const end = input('שעת סיום');
    for (const field of [date, start, end, description]) {
      await act(() => { field.focus(); field.click(); });
      expect(document.activeElement).toBe(field);
      expect(field.tabIndex).toBeGreaterThanOrEqual(0);
    }
    expect(date.type).toBe('date');
    expect(start.type).toBe('time');
    await change(start, '09:17');
    await change(end, '');
    await act(() => button('בריאות').click());
    expect(description.value).toBe('שורה ראשונה\nשורה שנייה');
    expect(date.value).toBe(existing.date);
    expect(dismiss).not.toHaveBeenCalled();
    await act(() => document.querySelector<HTMLElement>('[aria-label="שמירת התחייבות"]')!.click());
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ title: 'פגישה חדשה', description: 'שורה ראשונה\nשורה שנייה', date: existing.date, startTime: '09:17', endTime: null, lifeArea: 'health' });
    expect(close).toHaveBeenCalledTimes(1);
    expect(dismiss).not.toHaveBeenCalled();
  } finally {
    await act(() => root.unmount());
    container.remove();
    dismiss.mockRestore();
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});
