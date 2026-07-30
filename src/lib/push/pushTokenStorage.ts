/**
 * Dernier Expo Push Token enregistré — pour révocation au logout.
 * Pas un JWT : clé séparée de tokenStorage auth.
 */
import * as SecureStore from 'expo-secure-store';

const PUSH_TOKEN_KEY = 'himba.expoPushToken';

export async function getStoredPushToken(): Promise<string | null> {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

export async function setStoredPushToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}

export async function clearStoredPushToken(): Promise<void> {
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}
