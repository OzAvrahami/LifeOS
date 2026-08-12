import { render, screen, userEvent, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { InboxScreen } from '@/features/inbox/inbox-screen';

const initialMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

function renderInbox(
  initialState: 'normal' | 'empty' | 'busy' | 'processing' = 'normal',
  props: Partial<React.ComponentProps<typeof InboxScreen>> = {},
) {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <InboxScreen initialState={initialState} {...props} />
    </SafeAreaProvider>,
  );
}

describe('<InboxScreen />', () => {
  it('renders the approved normal hierarchy, fixtures, and quiet disclosures', async () => {
    await renderInbox();

    expect(screen.getByRole('header', { name: 'Inbox' })).toBeTruthy();
    expect(screen.getByText('4 דברים מחכים להחלטה')).toBeTruthy();
    expect(screen.getByText('לקבוע תור לרופא')).toBeTruthy();
    expect(screen.getByText('נוסף היום · 10:32')).toBeTruthy();
    expect(screen.getByText('לבדוק מחיר ל־Deco נוסף')).toBeTruthy();
    expect(screen.getAllByLabelText(/^פתח פעולות עבור /)).toHaveLength(4);
    expect(screen.queryAllByText('מיון')).toHaveLength(0);
  });

  it('renders the quiet empty state and keeps capture available', async () => {
    await renderInbox('empty');

    expect(screen.getByText('הכול מסודר')).toBeTruthy();
    expect(screen.getByText('אין כרגע דברים שמחכים להחלטה. מה שעולה לראש — פשוט תוסיף.')).toBeTruthy();
    expect(screen.getByLabelText('מה צריך לזכור')).toBeTruthy();
  });

  it('renders the supportive busy count with a compact sample and processing entry', async () => {
    await renderInbox('busy');

    expect(screen.getByText('23 דברים מחכים למיון')).toBeTruthy();
    expect(screen.getByText('מיין כמה עכשיו')).toBeTruthy();
    expect(screen.getAllByLabelText(/^פריט Inbox: /)).toHaveLength(7);
  });

  it('renders one processing item and advances locally after a decision', async () => {
    const user = userEvent.setup();
    await renderInbox('processing');

    expect(screen.getByText('3 מתוך 12')).toBeTruthy();
    expect(screen.getByText('לקבוע טיפול לרכב')).toBeTruthy();
    expect(screen.queryByText('לקנות כבל רשת')).toBeNull();

    await user.press(screen.getByText('השבוע'));

    expect(screen.getByText('4 מתוך 12')).toBeTruthy();
    expect(screen.getByText('לקנות כבל רשת')).toBeTruthy();
    expect(screen.queryByText('לקבוע טיפול לרכב')).toBeNull();
  });

  it('moves one task to Today without leaving a duplicate in Inbox', async () => {
    const onMoveToToday = jest.fn();
    const user = userEvent.setup();
    await renderInbox('normal', { onMoveToToday });

    await user.press(screen.getByLabelText('פתח פעולות עבור לקבוע תור לרופא'));
    const sheet = screen.getByLabelText('מה צריך לקרות עם זה');
    await user.press(within(sheet).getByText('היום'));

    expect(onMoveToToday).toHaveBeenCalledWith(expect.objectContaining({ id: 'doctor-appointment' }));
    expect(screen.queryByText('לקבוע תור לרופא')).toBeNull();
    expect(screen.getByText('3 דברים מחכים להחלטה')).toBeTruthy();
  });

  it('moves one task to Week locally and shows the approved confirmation', async () => {
    const user = userEvent.setup();
    await renderInbox();

    await user.press(screen.getByLabelText('פתח פעולות עבור לקבוע תור לרופא'));
    await user.press(within(screen.getByLabelText('מה צריך לקרות עם זה')).getByText('השבוע'));

    expect(screen.queryByLabelText('פריט Inbox: לקבוע תור לרופא')).toBeNull();
    expect(screen.getByText('נשלח לשבוע · אותה משימה, עכשיו בתכנון')).toBeTruthy();
    expect(screen.getByText('3 דברים מחכים להחלטה')).toBeTruthy();
    expect(within(screen.getByLabelText('מה צריך לקרות עם זה')).getByText('השבוע').parent?.props.accessibilityState).toEqual({ selected: true });
  });

  it('offers the lightweight approved day choice and moves the same item once', async () => {
    const user = userEvent.setup();
    await renderInbox();

    await user.press(screen.getByLabelText('פתח פעולות עבור לקבוע תור לרופא'));
    const sheet = screen.getByLabelText('מה צריך לקרות עם זה');
    await user.press(within(sheet).getByText('לבחור יום'));
    await user.press(within(sheet).getByText('ראשון · 9/8'));

    expect(screen.queryByText('לקבוע תור לרופא')).toBeNull();
    expect(screen.getByText('נקבע לראשון · 9/8 · אותה משימה')).toBeTruthy();
  });

  it('adds a title-only local item through the inline capture', async () => {
    const user = userEvent.setup();
    await renderInbox('empty');

    await user.type(screen.getByLabelText('מה צריך לזכור'), 'לבדוק רעיון חדש');
    await user.press(screen.getByLabelText('הוסף ל-Inbox'));

    expect(screen.getByText('לבדוק רעיון חדש')).toBeTruthy();
    expect(screen.getByText('דבר אחד מחכה להחלטה')).toBeTruthy();
    expect(screen.queryByText('הכול מסודר')).toBeNull();
  });

  it('marks Inbox selected and navigates back to Today or Week', async () => {
    const onNavigateToday = jest.fn();
    const onNavigateWeek = jest.fn();
    const user = userEvent.setup();
    await renderInbox('normal', { onNavigateToday, onNavigateWeek });

    const navigation = screen.getByLabelText('ניווט ראשי');
    expect(within(navigation).getByText('Inbox').parent?.props.accessibilityState).toEqual({ selected: true });

    await user.press(within(navigation).getByText('היום'));
    await user.press(within(navigation).getByText('שבוע'));

    expect(onNavigateToday).toHaveBeenCalledTimes(1);
    expect(onNavigateWeek).toHaveBeenCalledTimes(1);
  });

  it('opens the existing Quick Capture implementation from Inbox', async () => {
    const user = userEvent.setup();
    await renderInbox();

    await user.press(screen.getByLabelText('הוספה מהירה'));

    const sheet = screen.getByLabelText('חלונית הוספה מהירה');
    expect(within(sheet).getByLabelText('כותרת')).toBeTruthy();
    expect(within(sheet).getByText('Inbox').parent?.props.accessibilityState).toEqual({ selected: true });
  });
});
