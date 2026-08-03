import type { RatingSummary } from '@/schemas/ratings';

/** Sous ce seuil, on n’affiche pas la moyenne publique (évite un 5,0 trompeur). */
export const MIN_PUBLIC_RATING_VOTES = 3;

/**
 * Libellé compact type « ★ 4,2 · 12 », ou null si trop peu de votes.
 */
export function formatPublicAverageLabel(
  summary?: RatingSummary | null,
): string | null {
  if (
    summary == null ||
    summary.average == null ||
    summary.count < MIN_PUBLIC_RATING_VOTES
  ) {
    return null;
  }
  const avg = summary.average.toFixed(1).replace('.', ',');
  return `★ ${avg} · ${summary.count}`;
}
