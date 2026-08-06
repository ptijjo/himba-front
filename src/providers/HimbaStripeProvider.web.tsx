/**
 * Stub web — pas de StripeProvider (module natif incompatible).
 */
import type { ReactNode } from 'react';

export function HimbaStripeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
