/**
 * Cache mémoire des URLs de stream signées — prev/next sans attendre le réseau.
 * Marge de sécurité avant expiration réelle.
 */
type StreamCacheEntry = {
  url: string;
  expiresAtMs: number;
};

const SAFETY_MS = 30_000;
const cache = new Map<string, StreamCacheEntry>();

export function getCachedStreamUrl(trackId: string): string | null {
  const entry = cache.get(trackId);
  if (!entry) {
    return null;
  }
  if (Date.now() >= entry.expiresAtMs - SAFETY_MS) {
    cache.delete(trackId);
    return null;
  }
  return entry.url;
}

export function setCachedStreamUrl(
  trackId: string,
  url: string,
  expiresInSeconds: number,
): void {
  const ttlSec = Math.max(60, expiresInSeconds);
  cache.set(trackId, {
    url,
    expiresAtMs: Date.now() + ttlSec * 1000,
  });
}

export function clearCachedStreamUrl(trackId: string): void {
  cache.delete(trackId);
}
