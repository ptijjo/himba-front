import {
  becomeArtistFormSchema,
  becomeArtistSchema,
} from '@/schemas/artists';

describe('becomeArtistFormSchema', () => {
  it('refuse sans acceptation des conditions', () => {
    const parsed = becomeArtistFormSchema.safeParse({
      displayName: 'Soriba',
      bio: '',
      acceptArtistTerms: false,
    });
    expect(parsed.success).toBe(false);
  });

  it('accepte nom + conditions cochées', () => {
    const parsed = becomeArtistFormSchema.safeParse({
      displayName: 'Soriba',
      acceptArtistTerms: true,
    });
    expect(parsed.success).toBe(true);
  });

  it('corps API inchangé (sans flag UI)', () => {
    const parsed = becomeArtistSchema.safeParse({
      displayName: 'Soriba',
      bio: 'Zouk',
    });
    expect(parsed.success).toBe(true);
  });
});
