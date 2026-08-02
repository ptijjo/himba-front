import {
  ratingSchema,
  ratingSummarySchema,
  upsertRatingBodySchema,
} from '@/schemas/ratings';
import { trackSchema } from '@/schemas/tracks';
import { artistSchema } from '@/schemas/artists';
import { albumDetailSchema } from '@/schemas/albums';

describe('schemas/ratings', () => {
  it('ratingSummarySchema vide / rempli', () => {
    expect(
      ratingSummarySchema.safeParse({
        average: null,
        count: 0,
        myValue: null,
      }).success,
    ).toBe(true);
    expect(
      ratingSummarySchema.safeParse({
        average: 4.3,
        count: 12,
        myValue: 5,
      }).success,
    ).toBe(true);
    expect(
      ratingSummarySchema.safeParse({
        average: 4,
        count: 1,
        myValue: 6,
      }).success,
    ).toBe(false);
  });

  it('upsertRatingBodySchema exige une seule cible', () => {
    expect(
      upsertRatingBodySchema.safeParse({ value: 4, trackId: 't1' }).success,
    ).toBe(true);
    expect(
      upsertRatingBodySchema.safeParse({ value: 4, albumId: 'alb-1' }).success,
    ).toBe(true);
    expect(upsertRatingBodySchema.safeParse({ value: 4 }).success).toBe(false);
    expect(
      upsertRatingBodySchema.safeParse({
        value: 4,
        trackId: 't1',
        artistId: 'a1',
      }).success,
    ).toBe(false);
  });

  it('ratingSchema parse réponse upsert', () => {
    const parsed = ratingSchema.safeParse({
      id: 'r1',
      userId: 'u1',
      trackId: 't1',
      artistId: null,
      albumId: null,
      value: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(parsed.success).toBe(true);
  });

  it('détails track / artist / album acceptent ratingSummary', () => {
    const summary = { average: 4.0, count: 2, myValue: 4 };
    expect(
      trackSchema.safeParse({
        id: 't1',
        title: 'X',
        price: null,
        artistId: 'a1',
        ratingSummary: summary,
      }).success,
    ).toBe(true);
    expect(
      artistSchema.safeParse({
        id: 'a1',
        userId: 'u1',
        displayName: 'Nia',
        ratingSummary: summary,
      }).success,
    ).toBe(true);
    expect(
      albumDetailSchema.safeParse({
        id: 'alb-1',
        artistId: 'a1',
        title: 'LP',
        ratingSummary: summary,
        tracks: [],
      }).success,
    ).toBe(true);
  });
});
