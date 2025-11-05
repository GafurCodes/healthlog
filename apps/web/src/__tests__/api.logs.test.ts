jest.mock('../api/client', () => {
  const get = jest.fn();
  const post = jest.fn();
  const put = jest.fn();
  const del = jest.fn();
  return { apiClient: { get, post, put, delete: del } };
});

import { apiClient } from '../api/client';
import { logsApi } from '../api/logs';

describe('api/logs', () => {
  beforeEach(() => {
    (apiClient.get as jest.Mock).mockReset();
    (apiClient.post as jest.Mock).mockReset();
    (apiClient.put as jest.Mock).mockReset();
    (apiClient.delete as jest.Mock).mockReset();
  });

  it('list builds params and normalizes start/end dates', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        data: [{ id: 'l1' }],
        total: 1,
        page: 2,
        pageSize: 25,
        totalPages: 1,
      },
    });
    const r = await logsApi.list({
      type: 'meal',
      startDate: '2025-01-02',
      endDate: '2025-01-03',
      page: 2,
      pageSize: 25,
    });
    expect(apiClient.get).toHaveBeenCalledWith('/logs', {
      params: {
        type: 'meal',
        startDate: '2025-01-02T00:00:00.000Z',
        endDate: '2025-01-03T23:59:59.999Z',
        page: 2,
        pageSize: 25,
      },
    });
    expect(r.data.data[0].id).toBe('l1');
    expect(r.data.page).toBe(2);
    expect(r.data.pageSize).toBe(25);
  });

  it('list returns empty response on error', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('fail'));
    const r = await logsApi.list({ page: 3, pageSize: 5 });
    expect(r.data.data).toEqual([]);
    expect(r.data.page).toBe(3);
    expect(r.data.pageSize).toBe(5);
    expect(r.data.total).toBe(0);
    expect(r.data.totalPages).toBe(1);
  });

  it('get wraps data into { data: Log } when API returns { data: Log }', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { data: { id: 'l2', type: 'meal' } },
    });
    const r = await logsApi.get('l2');
    expect(apiClient.get).toHaveBeenCalledWith('/logs/l2');
    expect(r.data.data.id).toBe('l2');
  });

  it('get wraps data into { data: Log } when API returns Log directly', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { id: 'l3', type: 'workout' },
    });
    const r = await logsApi.get('l3');
    expect(r.data.data.id).toBe('l3');
  });

  it('create posts transformed payload and normalizes date-only', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { data: { id: 'l4', type: 'meal' } },
    });
    const r = await logsApi.create(
      { type: 'meal', calories: 500, protein: 40 } as any,
      '2025-01-02',
      'n'
    );
    expect(apiClient.post).toHaveBeenCalledWith('/logs', {
      type: 'meal',
      metrics: { calories: 500, protein: 40 },
      date: '2025-01-02T00:00:00.000Z',
      notes: 'n',
    });
    expect(r.data.data.id).toBe('l4');
  });

  it('update puts transformed payload and normalizes date-only', async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({
      data: { id: 'l5', type: 'workout' },
    });
    const r = await logsApi.update(
      'l5',
      { type: 'workout', duration: 30 } as any,
      '2025-01-03',
      'u'
    );
    expect(apiClient.put).toHaveBeenCalledWith('/logs/l5', {
      type: 'workout',
      metrics: { duration: 30 },
      date: '2025-01-03T00:00:00.000Z',
      notes: 'u',
    });
    expect(r.data.data.id).toBe('l5');
  });

  it('delete returns API response on success', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({
      data: { success: true, id: 'l6' },
    });
    const r = await logsApi.delete('l6');
    expect(apiClient.delete).toHaveBeenCalledWith('/logs/l6');
    expect(r).toEqual({ success: true, id: 'l6' });
  });

  it('delete returns { success:false, id } on error', async () => {
    (apiClient.delete as jest.Mock).mockRejectedValue(new Error('x'));
    const r = await logsApi.delete('l7');
    expect(r).toEqual({ success: false, id: 'l7' });
  });
});
