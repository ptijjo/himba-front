/**
 * Stockage sécurisé des tokens JWT Himba.
 * Access + refresh uniquement dans SecureStore — jamais Redux / AsyncStorage / logs.
 */
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'himba.accessToken';
const REFRESH_KEY = 'himba.refreshToken';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function setTokens(tokens: AuthTokens): Promise<void> {
  // 1. Persister les deux tokens après login / register / refresh (rotation API)
  await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
}

export async function clearTokens(): Promise<void> {
  // 1. Effacer après logout ou échec refresh
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
