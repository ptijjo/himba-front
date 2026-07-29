/**
 * Cache audio local — lecture immédiate (stream) + prefetch pour les replays.
 */
import { Directory, File, Paths } from 'expo-file-system';

const AUDIO_CACHE_DIR = 'himba-audio';

function ensureCacheDir(): Directory {
  const dir = new Directory(Paths.cache, AUDIO_CACHE_DIR);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

function cacheFile(trackId: string): File {
  return new File(ensureCacheDir(), `${trackId}.m4a`);
}

/** URI locale si déjà en cache, sinon null (lecture stream). */
export function getCachedTrackUri(trackId: string): string | null {
  try {
    const file = cacheFile(trackId);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}

/**
 * Prefetch en arrière-plan — n’bloque pas le play.
 * Les erreurs sont silencieuses (stream reste OK).
 */
export function prefetchTrackAudio(
  trackId: string,
  streamUrl: string,
): void {
  void (async () => {
    try {
      const dest = cacheFile(trackId);
      await File.downloadFileAsync(streamUrl, dest, { idempotent: true });
    } catch {
      // ignore — prochain play retentera
    }
  })();
}
