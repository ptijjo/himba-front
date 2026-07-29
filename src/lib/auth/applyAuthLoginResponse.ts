/**
 * Persistance session après login/register — tokens SecureStore + user Redux.
 */
import type { UnknownAction } from '@reduxjs/toolkit';

import { setTokens } from '@/lib/auth/tokenStorage';
import {
  authLoginResponseSchema,
  type AuthLoginResponse,
} from '@/schemas/auth';
import { setCredentials } from '@/store/slices/authSlice';

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
  return true;
}
