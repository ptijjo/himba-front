/**
 * Masquages locaux post-signalement (appareil + user).
 * Pas de tokens / PII sensibles — IDs de cibles uniquement.
 */
import * as SecureStore from 'expo-secure-store';

import type { ReportTargetType } from '@/schemas/reports';

export type HiddenContentEntry = {
  targetType: ReportTargetType;
  targetId: string;
};

const PREFIX = 'himba.hiddenContent.';

function storageKey(userId: string): string {
  return `${PREFIX}${userId}`;
}

export async function loadHiddenContent(
  userId: string,
): Promise<HiddenContentEntry[]> {
  const raw = await SecureStore.getItemAsync(storageKey(userId));
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isHiddenContentEntry);
  } catch {
    return [];
  }
}

export async function saveHiddenContent(
  userId: string,
  entries: HiddenContentEntry[],
): Promise<void> {
  await SecureStore.setItemAsync(storageKey(userId), JSON.stringify(entries));
}

export async function clearHiddenContent(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(storageKey(userId));
}

function isHiddenContentEntry(value: unknown): value is HiddenContentEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.targetType === 'string' &&
    typeof row.targetId === 'string' &&
    row.targetId.length > 0
  );
}
