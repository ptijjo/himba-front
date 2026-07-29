import * as SecureStore from 'expo-secure-store';

import { refreshAccessToken } from '@/lib/auth/refreshAccessToken';

describe('refreshAccessToken', () => {
  const getItemAsync = SecureStore.getItemAsync as jest.Mock;
  const setItemAsync = SecureStore.setItemAsync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retourne false sans refresh token', async () => {
    getItemAsync.mockResolvedValue(null);
    await expect(refreshAccessToken(jest.fn())).resolves.toBe(false);
  });

  it('retourne false si HTTP non OK', async () => {
    getItemAsync.mockResolvedValue('old-refresh');
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false });
    await expect(refreshAccessToken(fetchImpl)).resolves.toBe(false);
  });

  it('persiste les nouveaux tokens si OK', async () => {
    getItemAsync.mockResolvedValue('old-refresh');
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      }),
    });

    await expect(refreshAccessToken(fetchImpl)).resolves.toBe(true);
    expect(setItemAsync).toHaveBeenCalledWith('himba.accessToken', 'new-access');
    expect(setItemAsync).toHaveBeenCalledWith(
      'himba.refreshToken',
      'new-refresh',
    );
  });

  it('retourne false si body invalide', async () => {
    getItemAsync.mockResolvedValue('old-refresh');
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'only' }),
    });
    await expect(refreshAccessToken(fetchImpl)).resolves.toBe(false);
  });

  it('retourne false si fetch throw', async () => {
    getItemAsync.mockResolvedValue('old-refresh');
    const fetchImpl = jest.fn().mockRejectedValue(new Error('network'));
    await expect(refreshAccessToken(fetchImpl)).resolves.toBe(false);
  });
});
