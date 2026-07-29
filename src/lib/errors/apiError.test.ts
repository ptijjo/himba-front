import { getErrorMessage } from '@/lib/errors/apiError';

describe('getErrorMessage', () => {
  it('extrait message string Nest', () => {
    expect(
      getErrorMessage({ data: { message: 'Email déjà utilisé' }, status: 409 }),
    ).toBe('Email déjà utilisé');
  });

  it('extrait le premier message tableau', () => {
    expect(
      getErrorMessage({ data: { message: ['Champ invalide'] }, status: 400 }),
    ).toBe('Champ invalide');
  });

  it('mappe 401 / 403 / 409', () => {
    expect(getErrorMessage({ status: 401 })).toBe(
      'Identifiants invalides ou session expirée',
    );
    expect(getErrorMessage({ status: 403 })).toBe('Accès refusé');
    expect(getErrorMessage({ status: 409 })).toBe(
      'Conflit : cette ressource existe déjà',
    );
  });

  it('mappe FETCH_ERROR réseau', () => {
    expect(getErrorMessage({ status: 'FETCH_ERROR' })).toContain(
      'Serveur injoignable',
    );
  });

  it('fallback générique', () => {
    expect(getErrorMessage(null)).toBe('Une erreur est survenue');
  });
});
