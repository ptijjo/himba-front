/**
 * Mapping erreurs API Nest / réseau → messages UI français.
 */
type ApiErrorBody = {
  message?: string | string[];
  statusCode?: number;
};

export function getErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  const maybe = error as {
    data?: ApiErrorBody;
    status?: number | string;
    error?: string;
  };

  // RTK Query : échec réseau (API down, mauvaise IP, téléphone → localhost)
  if (maybe.status === 'FETCH_ERROR' || maybe.status === 'TIMEOUT_ERROR') {
    return 'Serveur injoignable. Vérifie ta connexion et que l’API Himba est accessible.';
  }

  const raw = maybe.data?.message;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw;
  }
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
    return raw[0];
  }

  if (maybe.status === 401) {
    return 'Identifiants invalides ou session expirée';
  }
  if (maybe.status === 403) {
    return 'Accès refusé';
  }
  if (maybe.status === 409) {
    return 'Conflit : cette ressource existe déjà';
  }

  return fallback;
}
