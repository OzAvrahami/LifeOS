import { render, screen, userEvent, within } from '@testing-library/react-native';

import { TodayScreen } from '@/features/today/today-screen';
import { UnscheduledWeekTasks } from '@/features/week/week.components';
import { WeekScreen } from '@/features/week/week-screen';

import { TestProviders } from '../test-utils/test-providers';

function renderWeek(
  initialState: 'normal' | 'unplanned' | 'overloaded' | 'planning' = 'normal',
  onNavigateToday?: () => void,
  onNavigateInbox?: () => void,
) {
  return render(
    <TestProviders>
      <WeekScreen
        initialState={initialState}
        onNavigateInbox={onNavigateInbox}
        onNavigateToday={onNavigateToday}
      />
    </TestProviders>,
  );
}

describe('<WeekScreen />', () => {
  it('renders all seven days in natural chronological order and identifies Today', async () => {
    await renderWeek();

    const overview = screen.getByLabelText('סקירת שבעת ימי השבוע');
    const rows = within(overview).getAllByLabelText(/^יום /);
    expect(rows.map((row) => row.props.accessibilityLabel)).toEqual([
      'יום ראשון',
      'יום שני',
      'יום שלישי',
      'יום רביעי',
      'יום חמישי',
      'יום שישי',
      'יום שבת',
    ]);
    expect(within(overview).getByLabelText('יום שבת').props.accessibilityState).toEqual({ selected: true });
  });

  it('renders weekly focuses and compact unscheduled tasks', async () => {
    const user = userEvent.setup();
    await renderWeek();

    expect(screen.getByLabelText('המיקוד השבועי')).toBeTruthy();
    expect(screen.getByText('לסיים את אפיון LifeOS')).toBeTruthy();
    expect(screen.getByLabelText('לתכנן השבוע')).toBeTruthy();
    expect(screen.getByText('עוד משימה אחת · לסדר מחסן ←')).toBeTruthy();
    expect(screen.queryByText('לסדר מחסן')).toBeNull();

    await user.press(screen.getByLabelText('הצג משימה נוספת'));
    expect(screen.getByText('לסדר מחסן')).toBeTruthy();
    expect(screen.getByLabelText('הצג פחות משימות').props.accessibilityState).toEqual({ expanded: true });

    await user.press(screen.getByLabelText('הצג פחות משימות'));
    expect(screen.queryByText('לסדר מחסן')).toBeNull();
    expect(screen.getByLabelText('הצג משימה נוספת').props.accessibilityState).toEqual({ expanded: false });
  });

  it.each([0, 1, 2])('keeps the compact list correct with %i week-planned Tasks', async (taskCount) => {
    const tasks = Array.from({ length: taskCount }, (_, index) => ({
      durationMinutes: 15,
      id: `compact-${index}`,
      title: `משימה ${index + 1}`,
    }));
    await render(
      <TestProviders>
        <UnscheduledWeekTasks tasks={tasks} />
      </TestProviders>,
    );

    expect(screen.queryAllByLabelText(/^בחר יום עבור /)).toHaveLength(taskCount);
    expect(screen.queryByLabelText(/^הצג .*נוספ/)).toBeNull();
  });

  it('renders the supportive overloaded-day warning and context', async () => {
    await renderWeek('overloaded');

    expect(screen.getByLabelText('אזהרת עומס שבועית')).toBeTruthy();
    expect(screen.getByText('יום שני עמוס משמעותית.')).toBeTruthy();
    expect(screen.getByText('עמוס מדי')).toBeTruthy();
    expect(screen.getByLabelText('משימות יום שני')).toBeTruthy();
  });

  it('renders an unplanned week with its invitation and fixed commitments', async () => {
    await renderWeek('unplanned');

    expect(screen.getByText('השבוע שלך עדיין פתוח')).toBeTruthy();
    expect(screen.getByText('תכנן את השבוע')).toBeTruthy();
    expect(screen.getByLabelText('כבר קבוע השבוע')).toBeTruthy();
    expect(screen.getByText('פגישת צוות')).toBeTruthy();
  });

  it('opens the weekly planning flow from the unplanned state', async () => {
    const user = userEvent.setup();
    await renderWeek('unplanned');

    await user.press(screen.getByText('תכנן את השבוע'));

    expect(screen.getByLabelText('תכנון השבוע')).toBeTruthy();
    expect(screen.getByText('שלב 1 מתוך 4')).toBeTruthy();
    expect(screen.getByText('מה נשאר מהשבוע הקודם?')).toBeTruthy();
  });

  it('marks Week selected and invokes Today navigation', async () => {
    const onNavigateToday = jest.fn();
    const user = userEvent.setup();
    await renderWeek('normal', onNavigateToday);

    const navigation = screen.getByLabelText('ניווט ראשי');
    expect(within(navigation).getByText('שבוע').parent?.props.accessibilityState).toEqual({ selected: true });
    await user.press(within(navigation).getByText('היום'));
    expect(onNavigateToday).toHaveBeenCalledTimes(1);
  });

  it('invokes Week navigation from Today', async () => {
    const onNavigateWeek = jest.fn();
    const user = userEvent.setup();
    await render(
      <TestProviders>
        <TodayScreen onNavigateWeek={onNavigateWeek} />
      </TestProviders>,
    );

    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('שבוע'));
    expect(onNavigateWeek).toHaveBeenCalledTimes(1);
  });

  it('invokes Inbox navigation from Week', async () => {
    const onNavigateInbox = jest.fn();
    const user = userEvent.setup();
    await renderWeek('normal', undefined, onNavigateInbox);

    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('Inbox'));
    expect(onNavigateInbox).toHaveBeenCalledTimes(1);
  });

  it('opens the existing Quick Capture sheet from Week', async () => {
    const user = userEvent.setup();
    await renderWeek();

    await user.press(screen.getByLabelText('הוספה מהירה'));

    const sheet = screen.getByLabelText('חלונית הוספה מהירה');
    expect(within(sheet).getByLabelText('כותרת')).toBeTruthy();
    expect(within(sheet).getByText('Inbox').parent?.props.accessibilityState).toEqual({ selected: true });
  });
});
