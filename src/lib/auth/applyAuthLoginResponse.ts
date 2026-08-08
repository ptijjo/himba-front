/**
 * Persistance session après login/register — tokens SecureStore + user Redux.
 * Charge aussi les masquages locaux du reporteur pour ce userId.
 */
import type { UnknownAction } from '@reduxjs/toolkit';

import { setTokens } from '@/lib/auth/tokenStorage';
import { loadHiddenContent } from '@/lib/reports/hiddenContentStorage';
import {
  authLoginResponseSchema,
  type AuthLoginResponse,
} from '@/schemas/auth';
import { setCredentials } from '@/store/slices/authSlice';
import { setHiddenContentHydrated } from '@/store/slices/hiddenContentSlice';

type AuthDispatch = (action: UnknownAction) => unknown;

export function parseAuthLoginResponse(
  data: unknown,
): AuthLoginResponse | null {
  const parsed = authLoginResponseSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export async function applyAuthLoginResponse(
  data: unknown,
  dispatch: AuthDispatch,
): Promise<boolean> {
  const parsed = parseAuthLoginResponse(data);
  if (!parsed) {
    return false;
  }

  await setTokens({
    accessToken: parsed.accessToken,
    refreshToken: parsed.refreshToken,
  });
  dispatch(setCredentials({ user: parsed.user }));
  const hidden = await loadHiddenContent(parsed.user.id);
  dispatch(
    setHiddenContentHydrated({
      userId: parsed.user.id,
      entries: hidden,
    }),
  );
  return true;
}
