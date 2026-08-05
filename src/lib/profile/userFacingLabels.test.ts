import {
  formatUserRoleLabel,
  formatUserStatusLabel,
} from '@/lib/profile/userFacingLabels';

describe('userFacingLabels', () => {
  it('traduit les rôles pour l’UI', () => {
    expect(formatUserRoleLabel('LISTENER')).toBe('Auditeur');
    expect(formatUserRoleLabel('ARTIST')).toBe('Artiste');
    expect(formatUserRoleLabel('ADMIN')).toBe('Équipe Himba');
  });

  it('masque le statut ACTIVE et expose les autres', () => {
    expect(formatUserStatusLabel('ACTIVE')).toBeNull();
    expect(formatUserStatusLabel('RESTRICTED')).toBe('Accès limité');
    expect(formatUserStatusLabel('BANNED')).toBe('Compte suspendu');
  });
});
