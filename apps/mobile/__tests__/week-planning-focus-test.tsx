import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import type { WeeklyFocus } from '@/features/planning/planning.types';
import { WeekPlanningFlow } from '@/features/week/week-planning-flow';

import { TestProviders } from '../test-utils/test-providers';

function focus(id: string, title: string, position: number): WeeklyFocus {
  return {
    createdAt: '2026-08-15T08:00:00.000Z',
    id,
    position,
    title,
    updatedAt: '2026-08-15T08:00:00.000Z',
    weekPlanId: 'week-plan-1',
  };
}

function savedFocuses(titles: string[]) {
  return titles.map((title, position) => focus(`saved-${position}`, title, position));
}

async function renderFocusStep(
  focuses: WeeklyFocus[],
  onSaveFocuses = jest.fn(async (titles: string[]) => savedFocuses(titles)),
) {
  const result = await render(
    <TestProviders>
      <WeekPlanningFlow
        focuses={focuses}
        initialStep={2}
        onDone={jest.fn()}
        onSaveFocuses={onSaveFocuses}
      />
    </TestProviders>,
  );
  return { onSaveFocuses, result };
}

function selectedFocusCount() {
  return screen.getAllByRole('checkbox').filter(
    (item) => item.props.accessibilityState?.checked,
  ).length;
}

describe('Weekly Planning custom focus selection', () => {
  it('does not add typed text until the explicit add action confirms it', async () => {
    const user = userEvent.setup();
    const { onSaveFocuses } = await renderFocusStep([focus('one', 'מיקוד קיים', 0)]);
    const input = screen.getByLabelText('מיקוד חדש');

    await user.type(input, 'מיקוד חדש לבדיקה');
    expect(screen.queryByLabelText('מיקוד חדש לבדיקה')).toBeNull();
    expect(onSaveFocuses).not.toHaveBeenCalled();

    await user.press(screen.getByLabelText('הוסף מיקוד'));
    expect(screen.getByLabelText('מיקוד חדש לבדיקה').props.accessibilityState.checked).toBe(false);
    expect(screen.getByLabelText('מיקוד חדש').props.value).toBe('');
    expect(selectedFocusCount()).toBe(1);
  });

  it('also confirms a custom focus through input submit', async () => {
    const user = userEvent.setup();
    await renderFocusStep([focus('one', 'מיקוד קיים', 0)]);
    const input = screen.getByLabelText('מיקוד חדש');
    await user.type(input, 'מיקוד דרך Enter');
    await act(async () => input.props.onSubmitEditing());

    expect(screen.getByLabelText('מיקוד דרך Enter').props.accessibilityState.checked).toBe(false);
    expect(screen.getByLabelText('מיקוד חדש').props.value).toBe('');
  });

  it('continues with selected rows only and never silently merges uncommitted input', async () => {
    const user = userEvent.setup();
    const { onSaveFocuses } = await renderFocusStep([focus('one', 'מיקוד קיים', 0)]);
    await user.type(screen.getByLabelText('מיקוד חדש'), 'מועמד לא מסומן');
    await user.press(screen.getByLabelText('הוסף מיקוד'));
    expect(screen.getByLabelText('מועמד לא מסומן').props.accessibilityState.checked).toBe(false);
    await user.type(screen.getByLabelText('מיקוד חדש'), 'לא נשמר בסתר');
    await user.press(screen.getByText('המשך'));

    await waitFor(() => expect(onSaveFocuses).toHaveBeenCalledWith(['מיקוד קיים']));
    expect(onSaveFocuses).not.toHaveBeenCalledWith(expect.arrayContaining(['מועמד לא מסומן']));
    expect(screen.queryByText('לא נשמר בסתר')).toBeNull();
  });

  it('allows a fourth candidate but blocks selecting it until another focus is deselected', async () => {
    const user = userEvent.setup();
    await renderFocusStep([
      focus('one', 'מיקוד ראשון', 0),
      focus('two', 'מיקוד שני', 1),
      focus('three', 'מיקוד שלישי', 2),
    ]);
    await user.type(screen.getByLabelText('מיקוד חדש'), 'מיקוד רביעי');
    await user.press(screen.getByLabelText('הוסף מיקוד'));

    expect(screen.getByLabelText('מיקוד רביעי').props.accessibilityState.checked).toBe(false);
    expect(selectedFocusCount()).toBe(3);
    expect(screen.getByLabelText('מיקוד חדש').props.value).toBe('');

    await user.press(screen.getByLabelText('מיקוד רביעי'));
    expect(screen.getByLabelText('מיקוד רביעי').props.accessibilityState.checked).toBe(false);
    expect(screen.getByText('אפשר לבחור עד 3 מיקודים. כדי לבחור מיקוד נוסף, בטל קודם אחד מהמיקודים שנבחרו.')).toBeTruthy();
    expect(selectedFocusCount()).toBe(3);

    await user.press(screen.getByLabelText('מיקוד ראשון'));
    expect(selectedFocusCount()).toBe(2);
    await user.press(screen.getByLabelText('מיקוד רביעי'));
    expect(screen.getByLabelText('מיקוד רביעי').props.accessibilityState.checked).toBe(true);
    expect(selectedFocusCount()).toBe(3);
  });

  it('normalizes titles and refuses to add a duplicate custom focus', async () => {
    const user = userEvent.setup();
    await renderFocusStep([focus('one', 'מיקוד קיים', 0)]);
    await user.type(screen.getByLabelText('מיקוד חדש'), '  מיקוד   קיים  ');
    await user.press(screen.getByLabelText('הוסף מיקוד'));

    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(selectedFocusCount()).toBe(1);
    expect(screen.getByText('המיקוד הזה כבר נמצא ברשימה.')).toBeTruthy();
  });
});
