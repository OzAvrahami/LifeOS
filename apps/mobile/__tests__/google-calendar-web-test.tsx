/** @jest-environment jsdom */
import { act, useState, type ReactNode } from 'react';
import { GoogleCalendarOption } from '@/features/settings/google-calendar-option';

jest.mock('react-native', () => ({ ...jest.requireActual('react-native-web'), TurboModuleRegistry: jest.requireActual('react-native').TurboModuleRegistry }));
const { createRoot } = jest.requireActual<{ createRoot: (container: Element) => { render: (node: ReactNode) => void; unmount: () => void } }>('react-dom/client');

it('calendar selection is focusable and toggles once by Space/Enter; disabled values are retained', async () => {
  const container = document.createElement('div'); document.body.appendChild(container); const root = createRoot(container);
  const env = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }; const previous = env.IS_REACT_ACT_ENVIRONMENT; env.IS_REACT_ACT_ENVIRONMENT = true;
  function Probe({ disabled = false }: { disabled?: boolean }) {
    const [value, setValue] = useState(false);
    return <GoogleCalendarOption label="יומן לבחירה" description="קריאה בלבד" value={value} disabled={disabled} onChange={setValue} />;
  }
  try {
    await act(() => root.render(<Probe />)); const option = container.querySelector<HTMLElement>('[role="checkbox"]')!;
    await act(() => option.focus()); expect(document.activeElement).toBe(option);
    expect(option.getAttribute('aria-checked')).toBe('false');
    await act(() => option.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })));
    expect(option.getAttribute('aria-checked')).toBe('true');
    await act(() => option.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true })));
    expect(option.getAttribute('aria-checked')).toBe('true');
    await act(() => option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    await act(() => option.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true })));
    expect(option.getAttribute('aria-checked')).toBe('false');
    await act(() => root.render(<Probe disabled />));
    await act(() => option.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })));
    expect(option.getAttribute('aria-disabled')).toBe('true'); expect(option.getAttribute('aria-checked')).toBe('false');
  } finally { await act(() => root.unmount()); container.remove(); env.IS_REACT_ACT_ENVIRONMENT = previous; }
});
