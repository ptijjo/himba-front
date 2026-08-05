import {
  authMessageResponseSchema,
  authLoginResponseSchema,
  forgotPasswordFormSchema,
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

  it('valide le formulaire register (mot de passe fort)', () => {
    expect(
      registerFormSchema.safeParse({
        username: 'ada',
        email: 'ada@himba.app',
        password: 'password',
        accountType: 'listener',
      }).success,
    ).toBe(false);
    expect(
      registerFormSchema.safeParse({
        username: 'ada_1',
        email: 'ada@himba.app',
        password: 'secret12',
        accountType: 'listener',
      }).success,
    ).toBe(false);
    expect(
      registerFormSchema.safeParse({
        username: 'ada_1',
        email: 'ada@himba.app',
        password: 'Secret12!',
        accountType: 'listener',
      }).success,
    ).toBe(true);
  });

  it('exige les CGU artiste si accountType = artist', () => {
    expect(
      registerFormSchema.safeParse({
        username: 'ada_1',
        email: 'ada@himba.app',
        password: 'Secret12!',
        accountType: 'artist',
        acceptArtistTerms: false,
      }).success,
    ).toBe(false);
    expect(
      registerFormSchema.safeParse({
        username: 'ada_1',
        email: 'ada@himba.app',
        password: 'Secret12!',
        accountType: 'artist',
        acceptArtistTerms: true,
      }).success,
    ).toBe(true);
  });

  it('valide le formulaire mot de passe oublié', () => {
    expect(forgotPasswordFormSchema.safeParse({ email: 'bad' }).success).toBe(
      false,
    );
    expect(
      forgotPasswordFormSchema.safeParse({ email: 'ada@himba.app' }).success,
    ).toBe(true);
  });

  it('valide les réponses message simples', () => {
    expect(authMessageResponseSchema.safeParse({ message: '' }).success).toBe(
      false,
    );
    expect(
      authMessageResponseSchema.safeParse({ message: 'OK' }).success,
    ).toBe(true);
  });
});
