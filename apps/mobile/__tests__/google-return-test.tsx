import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import GoogleReturnRoute from '@/app/settings/google-return';
import { apiRequest } from '@/lib/api/client';
import { googleAttemptStorage } from '@/features/settings/google-calendar.api';
import { TaskQueryScopeProvider } from '@/features/tasks/task-query-scope';
import { TestProviders } from '../test-utils/test-providers';

const mockReplace = jest.fn();
let mockParams: { attempt: string; receipt?: string; result: string };
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }), useLocalSearchParams: () => mockParams }));
jest.mock('@/lib/api/client', () => ({ apiRequest: jest.fn() }));
beforeEach(() => {
  jest.clearAllMocks(); mockParams = { attempt: 'attempt-A', receipt: 'receipt', result: 'ready' };
  jest.mocked(apiRequest).mockResolvedValue({ configured: true, status: 'disconnected', calendars: [], revision: 0 });
  jest.spyOn(googleAttemptStorage, 'clear').mockResolvedValue();
});
afterEach(() => jest.restoreAllMocks());
const tree = <TestProviders><TaskQueryScopeProvider userId="A"><GoogleReturnRoute /></TaskQueryScopeProvider></TestProviders>;
it('completes only after explicit action using the matching persisted attempt and callback receipt', async () => {
  jest.spyOn(googleAttemptStorage, 'read').mockResolvedValue({ id: 'attempt-A', proof: 'proof' });
  await render(tree); expect(jest.mocked(apiRequest).mock.calls.some(([path]) => path.endsWith('/complete'))).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'סיום החיבור ובחירת יומנים' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalled());
  expect(apiRequest).toHaveBeenCalledWith('/integrations/google/complete', expect.objectContaining({ expectedUserId: 'A', body: JSON.stringify({ id: 'attempt-A', proof: 'proof', receipt: 'receipt' }) }));
  expect(googleAttemptStorage.clear).toHaveBeenCalledWith('A');
});
it('a different account or stale attempt cannot complete; cancellation offers return only', async () => {
  jest.spyOn(googleAttemptStorage, 'read').mockResolvedValue({ id: 'attempt-B', proof: 'other-proof' });
  const view = await render(tree); await fireEvent.press(screen.getByRole('button', { name: 'סיום החיבור ובחירת יומנים' }));
  await screen.findByText(/לא הצלחנו להשלים/);
  expect(jest.mocked(apiRequest).mock.calls.some(([path]) => path.endsWith('/complete'))).toBe(false);
  await view.unmount(); mockParams = { attempt: 'attempt-A', result: 'cancelled' };
  await render(tree); expect(screen.queryByRole('button', { name: 'סיום החיבור ובחירת יומנים' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'חזרה לחיבורי יומן' })); expect(mockReplace).toHaveBeenCalled();
});
