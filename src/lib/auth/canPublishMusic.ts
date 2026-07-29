import type { UserRole } from '@/schemas/auth';

/** Publication titres : ARTIST + ADMIN uniquement (contrat API /roles). */
export function canPublishMusic(role: UserRole | undefined): boolean {
  return role === 'ARTIST' || role === 'ADMIN';
}
