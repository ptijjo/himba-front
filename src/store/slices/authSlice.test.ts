import { authReducer, clearCredentials, setCredentials, setHydrated, setLoading } from '@/store/slices/authSlice';
import type { AuthUser } from '@/schemas/auth';

const user: AuthUser = {
  id: 'u1',
  username: 'ada',
  email: 'ada@himba.app',
  role: 'LISTENER',
  status: 'ACTIVE',
  bio: null,
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('authSlice', () => {
  it('hydrate user sans tokens', () => {
    const state = authReducer(undefined, setCredentials({ user }));
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.username).toBe('ada');
    expect(state).not.toHaveProperty('accessToken');
  });

  it('clearCredentials remet l’état anonyme', () => {
    const loggedIn = authReducer(undefined, setCredentials({ user }));
    const cleared = authReducer(loggedIn, clearCredentials());
    expect(cleared.isAuthenticated).toBe(false);
    expect(cleared.user).toBeNull();
  });

  it('setHydrated et setLoading', () => {
    const hydrated = authReducer(undefined, setHydrated(true));
    expect(hydrated.isHydrated).toBe(true);
    const loading = authReducer(hydrated, setLoading(true));
    expect(loading.isLoading).toBe(true);
  });
});
