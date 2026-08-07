import {
  artistKycStatusSchema,
  artistMeSchema,
  becomeArtistFormSchema,
  becomeArtistSchema,
  stripeOnboardingLinkSchema,
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

describe('artistMeSchema / KYC', () => {
  it('parse GET /artists/me avec needsOnboarding', () => {
    const parsed = artistMeSchema.safeParse({
      id: 'a1',
      userId: 'u1',
      displayName: 'Soriba',
      bio: null,
      coverUrl: null,
      avatarUrl: null,
      stripeAccountId: null,
      kycStatus: 'PENDING',
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      stripeRequirementsDue: [],
      needsOnboarding: true,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.needsOnboarding).toBe(true);
    }
  });

  it('refuse kycStatus inconnu', () => {
    expect(artistKycStatusSchema.safeParse('DONE').success).toBe(false);
  });

  it('parse onboarding-link', () => {
    const parsed = stripeOnboardingLinkSchema.safeParse({
      onboardingUrl: 'https://connect.stripe.com/setup/e/acct_x/token',
      stripeAccountId: 'acct_123',
    });
    expect(parsed.success).toBe(true);
  });
});
