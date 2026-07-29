/**
 * Rotation refresh — POST /auth/refresh puis remplacement des deux tokens.
 */
import { getRefreshToken, setTokens } from '@/lib/auth/tokenStorage';
import { authTokensSchema } from '@/schemas/auth';
import { getApiBaseUrl } from '@/constants/api';

export async function refreshAccessToken(
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetchImpl(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const json: unknown = await response.json();
    const parsed = authTokensSchema.safeParse(json);
    if (!parsed.success) {
      return false;
    }

    await setTokens(parsed.data);
    return true;
  } catch {
    return false;
  }
}
