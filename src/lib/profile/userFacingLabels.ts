import type { UserRole, UserStatus } from '@/schemas/auth';

/** Libellés UI — jamais les enums bruts Prisma. */
export function formatUserRoleLabel(role: UserRole): string {
  switch (role) {
    case 'LISTENER':
      return 'Auditeur';
    case 'ARTIST':
      return 'Artiste';
    case 'ADMIN':
      return 'Équipe Himba';
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function formatUserStatusLabel(status: UserStatus): string | null {
  switch (status) {
    case 'ACTIVE':
      // Compte normal — pas besoin de le crier
      return null;
    case 'RESTRICTED':
      return 'Accès limité';
    case 'BANNED':
      return 'Compte suspendu';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
