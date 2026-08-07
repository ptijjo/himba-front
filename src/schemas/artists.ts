import { z } from 'zod';

import { ratingSummarySchema } from '@/schemas/ratings';

/** Corps API POST /artists/become */
export const becomeArtistSchema = z.object({
  displayName: z.string().min(2, 'Au moins 2 caractères').max(80),
  bio: z.string().max(1000).optional(),
});

/** Formulaire mobile — acceptation CGU obligatoire après scroll. */
export const becomeArtistFormSchema = becomeArtistSchema.extend({
  acceptArtistTerms: z.boolean().refine((v) => v === true, {
    message: 'Tu dois accepter les conditions artiste',
  }),
});

/** Changement de nom d’artiste — CGU à re-accepter. */
export const updateArtistDisplayNameFormSchema = z.object({
  displayName: z.string().min(2, 'Au moins 2 caractères').max(80),
  acceptArtistTerms: z.boolean().refine((v) => v === true, {
    message: 'Tu dois accepter à nouveau les conditions artiste',
  }),
});

/** KYC Stripe Connect Express — aligné Prisma ArtistKycStatus. */
export const artistKycStatusSchema = z.enum([
  'PENDING',
  'RESTRICTED',
  'VERIFIED',
]);

export const artistSchema = z.object({
  id: z.string(),
  userId: z.string(),
  displayName: z.string(),
  bio: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  /** Photo de profil User liée. */
  avatarUrl: z.string().nullable().optional(),
  /** Nombre de personnes qui suivent cet artiste. */
  followersCount: z.number().int().nonnegative().optional(),
  /** Nombre d’artistes suivis par ce compte. */
  followingCount: z.number().int().nonnegative().optional(),
  /** Présent sur GET /artists/:id (public). */
  kycStatus: artistKycStatusSchema.optional(),
  createdAt: z.union([z.string(), z.coerce.date()]).optional(),
  updatedAt: z.union([z.string(), z.coerce.date()]).optional(),
  /** Présent sur GET /artists/:id. */
  ratingSummary: ratingSummarySchema.optional(),
});

/**
 * GET /artists/me — profil artiste du user + flags KYC Stripe.
 * `null` si pas encore de profil Artist.
 */
export const artistMeSchema = artistSchema.extend({
  stripeAccountId: z.string().nullable(),
  kycStatus: artistKycStatusSchema,
  chargesEnabled: z.boolean(),
  payoutsEnabled: z.boolean(),
  detailsSubmitted: z.boolean(),
  stripeRequirementsDue: z.array(z.string()),
  needsOnboarding: z.boolean(),
});

/** POST /artists/me/stripe/onboarding-link */
export const stripeOnboardingLinkSchema = z.object({
  onboardingUrl: z.string().url(),
  stripeAccountId: z.string().min(1),
});

export type BecomeArtistValues = z.infer<typeof becomeArtistSchema>;
export type BecomeArtistFormValues = z.infer<typeof becomeArtistFormSchema>;
export type UpdateArtistDisplayNameFormValues = z.infer<
  typeof updateArtistDisplayNameFormSchema
>;
export type Artist = z.infer<typeof artistSchema>;
export type ArtistMe = z.infer<typeof artistMeSchema>;
export type ArtistKycStatus = z.infer<typeof artistKycStatusSchema>;
export type StripeOnboardingLink = z.infer<typeof stripeOnboardingLinkSchema>;
