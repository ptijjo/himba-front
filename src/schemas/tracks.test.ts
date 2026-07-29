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

  it('parse des recommandations (tableau)', () => {
    expect(recommendationsSchema.safeParse([track]).success).toBe(true);
    expect(recommendationsSchema.safeParse({ items: [] }).success).toBe(false);
  });
});
