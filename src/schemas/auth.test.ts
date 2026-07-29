import {
  authLoginResponseSchema,
  loginFormSchema,
  registerFormSchema,
} from '@/schemas/auth';

describe('auth schemas', () => {
  it('accepte une AuthLoginResponse valide', () => {
    const parsed = authLoginResponseSchema.safeParse({
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
    });

    expect(parsed.success).toBe(true);
  });

  it('rejette isAdmin (contrat Himba = role)', () => {
    const parsed = authLoginResponseSchema.safeParse({
      accessToken: 'access',
      refreshToken: 'refresh',
      sessionId: 'sess-1',
      user: {
        id: 'u1',
        username: 'ada',
        email: 'ada@himba.app',
        isAdmin: true,
        status: 'ACTIVE',
        bio: null,
        avatarUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    expect(parsed.success).toBe(false);
  });

  it('valide le formulaire login', () => {
    expect(loginFormSchema.safeParse({ login: '', password: 'x' }).success).toBe(
      false,
    );
    expect(
      loginFormSchema.safeParse({ login: 'ada', password: 'secret' }).success,
    ).toBe(true);
  });

  it('valide le formulaire register (lettre + chiffre)', () => {
    expect(
      registerFormSchema.safeParse({
        username: 'ada',
        email: 'ada@himba.app',
        password: 'password',
      }).success,
    ).toBe(false);
    expect(
      registerFormSchema.safeParse({
        username: 'ada_1',
        email: 'ada@himba.app',
        password: 'secret12',
      }).success,
    ).toBe(true);
  });
});
