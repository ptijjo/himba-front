/**
 * expo-audio n’expose pas prev/next titre : les boutons lock screen
 * font un seek ±10 s. On détecte ce saut pour enchaîner la file.
 */

const SEEK_JUMP_MIN = 8;
const SEEK_JUMP_MAX = 12;

export type LockScreenSkipDirection = 'next' | 'prev';

/**
 * @returns direction file si le delta ressemble au seek natif ±10 s
 * (pas un scrub libre sur la barre de progression).
 */
export function detectLockScreenSkip(
  prevTime: number,
  currentTime: number,
): LockScreenSkipDirection | null {
  const delta = currentTime - prevTime;

  // Seek forward natif (~+10 s) → titre suivant
  if (delta >= SEEK_JUMP_MIN && delta <= SEEK_JUMP_MAX) {
    return 'next';
  }

  // Seek backward natif (~-10 s) → titre précédent
  if (delta <= -SEEK_JUMP_MIN && delta >= -SEEK_JUMP_MAX) {
    return 'prev';
  }

  // Près du début : rewind clampé à 0 (saut souvent < 8 s)
  if (
    prevTime > 0.5 &&
    prevTime <= SEEK_JUMP_MAX &&
    currentTime < 0.5 &&
    delta < -0.4
  ) {
    return 'prev';
  }

  return null;
}
