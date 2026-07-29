import * as SecureStore from 'expo-secure-store';

import {
  applyAuthLoginResponse,
  parseAuthLoginResponse,
} from '@/lib/auth/applyAuthLoginResponse';
import { setCredentials } from '@/store/slices/authSlice';

describe('applyAuthLoginResponse', () => {
  const setItemAsync = SecureStore.setItemAsync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const valid = {
    accessToken: 'access',
    refreshToken: 'refresh',
    sessionId: 'sess-1',
    user: {
      id: 'u1',
      username: 'ada',
      email: 'ada@himba.app',
      role: 'LISTENER',
      status: 'ACTIVE',
      bio: null,
      avatarUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  };

  it('parse une réponse valide', () => {
    expect(parseAuthLoginResponse(valid)?.user.username).toBe('ada');
  });

  it('rejette une réponse invalide', () => {
    expect(parseAuthLoginResponse({ accessToken: 'x' })).toBeNull();
  });

  it('stocke tokens et dispatch user', async () => {
    const dispatch = jest.fn();
    const ok = await applyAuthLoginResponse(valid, dispatch);

    expect(ok).toBe(true);
    expect(setItemAsync).toHaveBeenCalledWith('himba.accessToken', 'access');
    expect(setItemAsync).toHaveBeenCalledWith('himba.refreshToken', 'refresh');
    expect(dispatch).toHaveBeenCalledWith(
      setCredentials({ user: expect.objectContaining({ username: 'ada' }) }),
    );
  });

  it('retourne false si Zod échoue', async () => {
    const dispatch = jest.fn();
    await expect(applyAuthLoginResponse({}, dispatch)).resolves.toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
