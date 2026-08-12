import { render, screen, userEvent, within } from '@testing-library/react-native';

import { TodayScreen } from '@/features/today/today-screen';

import { TestProviders } from '../test-utils/test-providers';

describe('<TodayScreen />', () => {
  it('renders the normal day hierarchy and fixture content', async () => {
    await render(
      <TestProviders>
        <TodayScreen />
      </TestProviders>,
    );

    expect(screen.getByText('בוקר טוב, עוז')).toBeTruthy();
    expect(screen.getByText('שבת, 8 באוגוסט')).toBeTruthy();
    expect(screen.getByLabelText('עכשיו')).toBeTruthy();
    expect(screen.getByLabelText('התחייבויות')).toBeTruthy();
    expect(screen.getByLabelText('המשימות שלי')).toBeTruthy();
    expect(screen.getByLabelText('אפשר להוסיף להיום')).toBeTruthy();
  });

  it('renders the approved navigation with Today selected', async () => {
    await render(
      <TestProviders>
        <TodayScreen />
      </TestProviders>,
    );

    const navigation = screen.getByLabelText('ניווט ראשי');
    expect(within(navigation).getByText('היום')).toBeTruthy();
    expect(within(navigation).getByText('שבוע')).toBeTruthy();
    expect(within(navigation).getByText('Inbox')).toBeTruthy();
    expect(within(navigation).getByText('עוד')).toBeTruthy();
    expect(within(navigation).getByLabelText('הוספה מהירה')).toBeTruthy();
    expect(within(navigation).getByText('היום').parent?.props.accessibilityState).toEqual({ selected: true });
  });

  it('invokes Inbox navigation from Today', async () => {
    const onNavigateInbox = jest.fn();
    const user = userEvent.setup();
    await render(
      <TestProviders>
        <TodayScreen onNavigateInbox={onNavigateInbox} />
      </TestProviders>,
    );

    await user.press(within(screen.getByLabelText('ניווט ראשי')).getByText('Inbox'));
    expect(onNavigateInbox).toHaveBeenCalledTimes(1);
  });

  it('renders a moved Inbox task once with the approved Today confirmation', async () => {
    await render(
      <TestProviders>
        <TodayScreen movedInboxTask={{ id: 'same-task', title: 'לקבוע טיפול לרכב' }} />
      </TestProviders>,
    );

    expect(screen.getAllByText('לקבוע טיפול לרכב')).toHaveLength(1);
    expect(screen.getByText('נוסף להיום מה־Inbox · אותה משימה')).toBeTruthy();
    expect(screen.getByText('5 משימות')).toBeTruthy();
  });

  it('renders an open but shaped unplanned day', async () => {
    await render(
      <TestProviders>
        <TodayScreen initialState="unplanned" />
      </TestProviders>,
    );

    expect(screen.getByText('היום שלך עדיין פתוח')).toBeTruthy();
    expect(screen.getByText('אין משימות מתוכננות · 2 התחייבויות היום')).toBeTruthy();
    expect(screen.getByLabelText('כבר ביומן')).toBeTruthy();
  });

  it('renders an active task with finish and stop controls but no timer', async () => {
    await render(
      <TestProviders>
        <TodayScreen initialState="active" />
      </TestProviders>,
    );

    expect(screen.getByLabelText('פעיל עכשיו')).toBeTruthy();
    expect(screen.getByText('הערכה: כ־60 דקות · עבודה')).toBeTruthy();
    expect(screen.getByText('סיום')).toBeTruthy();
    expect(screen.getByText('עצירה')).toBeTruthy();
    expect(screen.queryByText('00:00')).toBeNull();
    expect(screen.queryByText(/טיימר|זמן שחלף/)).toBeNull();
  });

  it('renders the warm overloaded-day guidance', async () => {
    await render(
      <TestProviders>
        <TodayScreen initialState="overloaded" />
      </TestProviders>,
    );

    expect(screen.getByText('עמוס מדי')).toBeTruthy();
    expect(screen.getByLabelText('אזהרת עומס')).toBeTruthy();
    expect(screen.getByText('נראה שתכננת יותר ממה שניתן להספיק היום.')).toBeTruthy();
    expect(screen.getByText('לשקול מחדש את היום')).toBeTruthy();
  });

  it('renders human-readable partial progress without a productivity percentage', async () => {
    await render(
      <TestProviders>
        <TodayScreen initialState="partially_completed" />
      </TestProviders>,
    );

    expect(screen.getByText('2 הושלמו · 1 נשארה')).toBeTruthy();
    expect(screen.getByLabelText('משימות שהושלמו')).toBeTruthy();
    expect(screen.queryByText(/%|אחוז|ציון/)).toBeNull();
  });

  it('opens Quick Capture with a required title and Inbox selected by default', async () => {
    const user = userEvent.setup();
    await render(
      <TestProviders>
        <TodayScreen />
      </TestProviders>,
    );

    await user.press(screen.getByLabelText('הוספה מהירה'));

    const sheet = screen.getByLabelText('חלונית הוספה מהירה');
    expect(within(sheet).getByLabelText('כותרת')).toBeTruthy();
    expect(within(sheet).getByText('Inbox').parent?.props.accessibilityState).toEqual({ selected: true });
  });

  it('dismisses Quick Capture from its backdrop', async () => {
    const user = userEvent.setup();
    await render(
      <TestProviders>
        <TodayScreen />
      </TestProviders>,
    );

    await user.press(screen.getByLabelText('הוספה מהירה'));
    await user.press(screen.getByLabelText('סגור הוספה מהירה'));

    expect(screen.queryByLabelText('כותרת')).toBeNull();
  });
});
