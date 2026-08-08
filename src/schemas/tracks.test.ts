import { trackListSchema, recommendationsSchema } from '@/schemas/tracks';

describe('tracks schemas', () => {
  const track = {
    id: 't1',
    title: 'Sunrise',
    genre: 'AFRO',
    price: null,
    coverUrl: null,
    artistId: 'a1',
    durationMs: 180000,
    artist: { id: 'a1', displayName: 'Nia' },
  };

  it('parse une liste paginée', () => {
    const parsed = trackListSchema.safeParse({
      items: [track],
      nextCursor: null,
    });
    expect(parsed.success).toBe(true);
  });

  it('parse price Decimal string', () => {
    const parsed = trackListSchema.safeParse({
      items: [{ ...track, price: '2.50' }],
      nextCursor: null,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items[0]?.price).toBe(2.5);
    }
  });

  it('parse price objet Decimal-like (bug reco API)', () => {
    const parsed = recommendationsSchema.safeParse([
      { ...track, price: { value: '1.99' } },
    ]);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data[0]?.price).toBe(1.99);
    }
  });

  it('parse des recommandations (tableau)', () => {
    expect(recommendationsSchema.safeParse([track]).success).toBe(true);
    expect(recommendationsSchema.safeParse({ items: [] }).success).toBe(false);
  });
});