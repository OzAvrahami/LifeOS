import { render, screen, userEvent, within } from '@testing-library/react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { InboxScreen } from '@/features/inbox/inbox-screen';
import { useDemoTasks } from '@/features/tasks/demo-task-provider';
import { TodayScreen } from '@/features/today/today-screen';
import { WeekScreen } from '@/features/week/week-screen';

import { TestProviders } from '../test-utils/test-providers';

type DemoRoute = 'today' | 'week' | 'inbox';

function CoreFlowHarness({ initialRoute = 'today' }: { initialRoute?: DemoRoute }) {
  const [route, setRoute] = useState<DemoRoute>(initialRoute);
  const [movedTaskId, setMovedTaskId] = useState<string>();

  return (
    <>
      {route === 'today' ? (
        <TodayScreen
          movedTaskId={movedTaskId}
          onNavigateInbox={() => setRoute('inbox')}
          onNavigateWeek={() => setRoute('week')}
        />
      ) : route === 'week' ? (
        <WeekScreen
          onNavigateInbox={() => setRoute('inbox')}
          onNavigateToday={() => setRoute('today')}
        />
      ) : (
        <InboxScreen
          onMoveToToday={(task) => {
            setMovedTaskId(task.id);
            setRoute('today');
          }}
          onNavigateToday={() => setRoute('today')}
          onNavigateWeek={() => setRoute('week')}
        />
      )}
      <TaskStateProbe />
    </>
  );
}

function TaskStateProbe() {
  const { tasks } = useDemoTasks();

  return (
    <View accessibilityLabel="מצב משימות מקומי">
      {tasks.map((task) => (
        <Text accessibilityLabel={`task-state:${task.title}`} key={task.id}>
          {JSON.stringify(task)}
        </Text>
      ))}
    </View>
  );
}

function renderFlow(initialRoute: DemoRoute = 'today') {
  return render(
    <TestProviders>
      <CoreFlowHarness initialRoute={initialRoute} />
    </TestProviders>,
  );
}

function getTask(title: string) {
  const matches = screen.getAllByLabelText(`task-state:${title}`);
  expect(matches).toHaveLength(1);
  return JSON.parse(matches[0].props.children as string) as {
    id: string;
    status: string;
    plannedDate: string | null;
    weekPlanId: string | null;
  };
}

async function capture(title: string, destination?: 'Inbox' | 'היום' | 'השבוע') {
  const user = userEvent.setup();
  await user.press(screen.getByLabelText('הוספה מהירה'));
  const sheet = screen.getByLabelText('חלונית הוספה מהירה');
  await user.type(within(sheet).getByLabelText('כותרת'), title);
  if (destination) await user.press(within(sheet).getByText(destination));
  await user.press(within(sheet).getByText('שמירה'));
}

describe('core local Task flow', () => {
  it('moves one captured task through Inbox, Week, Today, Active, Stop, and Done', async () => {
    const user = userEvent.setup();
    const title = 'לתאם בדיקת רכב';
    await renderFlow();

    await capture(title);
    const capturedTask = getTask(title);
    expect(capturedTask.status).toBe('open');
    expect(capturedTask.plannedDate).toBeNull();
    expect(capturedTask.weekPlanId).toBeNull();

    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('Inbox'));
    expect(screen.getByText(title)).toBeTruthy();

    await user.press(screen.getByLabelText(`פתח פעולות עבור ${title}`));
    await user.press(within(screen.getByLabelText('מה צריך לקרות עם זה')).getByText('השבוע'));
    expect(screen.queryByLabelText(`פריט Inbox: ${title}`)).toBeNull();
    expect(getTask(title)).toEqual(expect.objectContaining({
      id: capturedTask.id,
      plannedDate: null,
      status: 'open',
    }));
    expect(getTask(title).weekPlanId).not.toBeNull();

    await user.press(screen.getByLabelText('סגור פעולות Inbox'));
    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('שבוע'));
    expect(screen.getByText(title)).toBeTruthy();

    await user.press(screen.getByLabelText(`בחר יום עבור ${title}`));
    await user.press(screen.getByLabelText(`שבץ להיום: ${title}`));
    expect(getTask(title)).toEqual(expect.objectContaining({
      id: capturedTask.id,
      plannedDate: '2026-08-08',
      status: 'open',
      weekPlanId: null,
    }));

    await user.press(screen.getByLabelText(`התחל משימה: ${title}`));
    expect(screen.getByLabelText('פעיל עכשיו')).toBeTruthy();
    expect(getTask(title)).toEqual(expect.objectContaining({ id: capturedTask.id, status: 'in_progress' }));

    await user.press(screen.getByText('עצירה'));
    expect(getTask(title)).toEqual(expect.objectContaining({ id: capturedTask.id, status: 'open' }));
    expect(screen.getByLabelText(`התחל משימה: ${title}`)).toBeTruthy();

    await user.press(screen.getByLabelText(`התחל משימה: ${title}`));
    await user.press(screen.getByText('סיום'));
    expect(getTask(title)).toEqual(expect.objectContaining({ id: capturedTask.id, status: 'completed' }));
    expect(within(screen.getByLabelText('משימות שהושלמו')).getByText(title)).toBeTruthy();
  });

  it('moves an Inbox task directly to Today with one stable identity and no duplicate', async () => {
    const user = userEvent.setup();
    const title = 'לקבוע תור לרופא';
    await renderFlow('inbox');
    const originalTask = getTask(title);

    await user.press(screen.getByLabelText(`פתח פעולות עבור ${title}`));
    await user.press(within(screen.getByLabelText('מה צריך לקרות עם זה')).getByText('היום'));

    expect(screen.getByText('נוסף להיום מה־Inbox · אותה משימה')).toBeTruthy();
    expect(screen.getAllByText(title)).toHaveLength(1);
    expect(getTask(title)).toEqual(expect.objectContaining({
      id: originalTask.id,
      plannedDate: '2026-08-08',
      status: 'open',
      weekPlanId: null,
    }));

    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('Inbox'));
    expect(screen.queryByLabelText(`פריט Inbox: ${title}`)).toBeNull();
  });

  it('captures directly to Today and Week and retains both tasks across route changes', async () => {
    const user = userEvent.setup();
    await renderFlow();

    await capture('משימה ישירה להיום', 'היום');
    const todayTask = getTask('משימה ישירה להיום');
    expect(todayTask.plannedDate).toBe('2026-08-08');
    expect(screen.getByText('משימה ישירה להיום')).toBeTruthy();

    await capture('משימה ישירה לשבוע', 'השבוע');
    const weekTask = getTask('משימה ישירה לשבוע');
    expect(weekTask.weekPlanId).not.toBeNull();
    expect(weekTask.plannedDate).toBeNull();

    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('שבוע'));
    expect(screen.getByText('משימה ישירה לשבוע')).toBeTruthy();
    expect(getTask('משימה ישירה להיום').id).toBe(todayTask.id);

    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('Inbox'));
    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('שבוע'));
    expect(getTask('משימה ישירה לשבוע').id).toBe(weekTask.id);
    expect(screen.getByText('משימה ישירה לשבוע')).toBeTruthy();
  });

  it('returns the previous active task to open when another Today task starts', async () => {
    const user = userEvent.setup();
    await renderFlow();

    await user.press(within(screen.getByLabelText('עכשיו')).getByText('התחלה'));
    expect(getTask('לעבוד על LifeOS').status).toBe('in_progress');

    await user.press(screen.getByLabelText('התחל משימה: לסדר משהו בבית'));
    expect(getTask('לעבוד על LifeOS').status).toBe('open');
    expect(getTask('לסדר משהו בבית').status).toBe('in_progress');
    expect(screen.getByLabelText('פעיל עכשיו')).toBeTruthy();
  });
});
