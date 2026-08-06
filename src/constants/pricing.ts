/**
 * Bornes tarifaires — miroir himba-api TRACK_PRICE_MIN / TRACK_PRICE_MAX.
 * Min 0.50 € = plancher Stripe EUR (PaymentIntent).
 */
export const TRACK_PRICE_MIN_EUROS = 0.5;
export const TRACK_PRICE_MAX_EUROS = 99.99;

export function formatTrackPriceEuros(price: number): string {
  return `${price.toFixed(2)} €`;
}

/** Parse saisie FR (`1,99`) → euros, ou null si invalide. */
export function parsePriceEurosInput(raw: string): number | null {
  const euros = Number(raw.trim().replace(',', '.'));
  if (!Number.isFinite(euros)) {
    return null;
  }
  return Math.round(euros * 100) / 100;
}

export function isPriceInAllowedRange(euros: number): boolean {
  return (
    euros >= TRACK_PRICE_MIN_EUROS &&
    euros <= TRACK_PRICE_MAX_EUROS &&
    Number.isFinite(euros)
  );
}
