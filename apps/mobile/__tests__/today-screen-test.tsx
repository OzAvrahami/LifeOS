import { render, screen, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TodayScreen } from '@/features/today/today-screen';

const initialMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

describe('<TodayScreen />', () => {
  it('renders the normal day hierarchy and fixture content', async () => {
    await render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <TodayScreen />
      </SafeAreaProvider>,
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
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <TodayScreen />
      </SafeAreaProvider>,
    );

    const navigation = screen.getByLabelText('ניווט ראשי');
    expect(within(navigation).getByText('היום')).toBeTruthy();
    expect(within(navigation).getByText('שבוע')).toBeTruthy();
    expect(within(navigation).getByText('Inbox')).toBeTruthy();
    expect(within(navigation).getByText('עוד')).toBeTruthy();
    expect(within(navigation).getByLabelText('הוספה מהירה')).toBeTruthy();
    expect(within(navigation).getByText('היום').parent?.props.accessibilityState).toEqual({ selected: true });
  });
});
