/** @jest-environment jsdom */

import { act, type ReactNode } from 'react';

import { CommitmentDateField, CommitmentTimeField, CommitmentTimePicker, CommitmentTimePickerProvider } from '@/features/commitments/commitment-date-time-fields.web';

// The checkout includes react-dom but not its optional TypeScript declarations.
const { createRoot } = jest.requireActual<{
  createRoot: (container: Element) => { render: (node: ReactNode) => void; unmount: () => void };
}>('react-dom/client');

it('retains the Web HTML date/time inputs and empty optional-end behavior', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const dateChange = jest.fn();
  const timeChange = jest.fn();
  const actEnvironment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
  const previous = actEnvironment.IS_REACT_ACT_ENVIRONMENT;
  actEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    await act(() => root.render(
      <CommitmentTimePickerProvider>
        <CommitmentDateField onChange={dateChange} value="2026-09-08" />
        <CommitmentTimeField accessibilityLabel="end" onChange={timeChange} optional placeholder="end" value="10:25" />
        <CommitmentTimePicker />
      </CommitmentTimePickerProvider>,
    ));
    const date = container.querySelector<HTMLInputElement>('input[type="date"]')!;
    const time = container.querySelector<HTMLInputElement>('input[type="time"]')!;
    expect(date.value).toBe('2026-09-08');
    expect(time.value).toBe('10:25');
    expect(time.dir).toBe('ltr');
    expect(time.step).toBe('900'); // Preserve the pre-existing Web contract in this native fix.
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    await act(() => {
      setValue.call(time, '');
      time.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(timeChange).toHaveBeenCalledWith(null);
    expect(dateChange).not.toHaveBeenCalled();
    await act(() => {
      setValue.call(date, '2026-09-10');
      date.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(dateChange).toHaveBeenCalledWith('2026-09-10');
  } finally {
    await act(() => root.unmount());
    container.remove();
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = previous;
  }
});
