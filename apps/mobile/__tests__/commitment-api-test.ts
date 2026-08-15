import {
  createCommitment,
  deleteCommitment,
  listCommitments,
  updateCommitment,
} from '@/features/commitments/commitment.api';
import type { Commitment } from '@/features/commitments/commitment.types';
import { apiRequest } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({ apiRequest: jest.fn() }));

const request = jest.mocked(apiRequest);
const commitment: Commitment = {
  createdAt: '2026-08-15T08:00:00.000Z',
  date: '2026-08-17',
  description: null,
  endTime: '10:30',
  id: 'commitment-1',
  lifeArea: 'health',
  startTime: '09:30',
  title: 'תור לרופא',
  updatedAt: '2026-08-15T08:00:00.000Z',
};

beforeEach(() => request.mockReset());

describe('Commitment API client', () => {
  it('uses authenticated Node routes and maps date/range filters', async () => {
    request.mockResolvedValue({ commitments: [commitment] });
    await expect(listCommitments({ date: commitment.date })).resolves.toEqual([commitment]);
    await listCommitments({ dateFrom: '2026-08-16', dateTo: '2026-08-22' });

    expect(request).toHaveBeenNthCalledWith(1, '/commitments?date=2026-08-17', { auth: 'required' });
    expect(request).toHaveBeenNthCalledWith(2, '/commitments?dateFrom=2026-08-16&dateTo=2026-08-22', { auth: 'required' });
  });

  it('creates, updates, and physically deletes through the authenticated API', async () => {
    request
      .mockResolvedValueOnce({ commitment })
      .mockResolvedValueOnce({ commitment: { ...commitment, title: 'עודכן' } })
      .mockResolvedValueOnce({ commitment });
    const input = {
      date: commitment.date,
      endTime: commitment.endTime,
      startTime: commitment.startTime,
      title: commitment.title,
    };
    await createCommitment(input);
    await updateCommitment({ id: commitment.id, input: { title: 'עודכן' } });
    await deleteCommitment(commitment.id);

    expect(request).toHaveBeenNthCalledWith(1, '/commitments', expect.objectContaining({
      auth: 'required', method: 'POST', body: JSON.stringify(input),
    }));
    expect(request).toHaveBeenNthCalledWith(2, `/commitments/${commitment.id}`, expect.objectContaining({
      auth: 'required', method: 'PATCH', body: JSON.stringify({ title: 'עודכן' }),
    }));
    expect(request).toHaveBeenNthCalledWith(3, `/commitments/${commitment.id}`, {
      auth: 'required', method: 'DELETE',
    });
  });
});
