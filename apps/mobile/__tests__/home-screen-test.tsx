import { render, screen } from '@testing-library/react-native';

import { HomeScreen } from '@/features/home/home-screen';

describe('<HomeScreen />', () => {
  it('renders the LifeOS starting message', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText('LifeOS')).toBeTruthy();
    expect(screen.getByText('Your day, clearly.')).toBeTruthy();
  });
});
