import {
  albumDetailSchema,
  toAlbumPrice,
  updateAlbumSchema,
} from '@/schemas/albums';

describe('updateAlbumSchema', () => {
  it('accepte une édition sans nouvelle cover', () => {
    const parsed = updateAlbumSchema.safeParse({
      title: 'EP Un',
      description: 'Premier projet',
      pricing: 'free',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(toAlbumPrice(parsed.data)).toBeNull();
    }
  });

  it('exige un prix si payant', () => {
    const parsed = updateAlbumSchema.safeParse({
      title: 'EP Un',
      pricing: 'paid',
      priceEuros: '',
    });
    expect(parsed.success).toBe(false);
  });

  it('convertit le prix album', () => {
    const parsed = updateAlbumSchema.safeParse({
      title: 'EP Un',
      pricing: 'paid',
      priceEuros: '4,99',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(toAlbumPrice(parsed.data)).toBe(4.99);
    }
  });
});

describe('albumDetailSchema', () => {
  it('parse un album avec titres', () => {
    const parsed = albumDetailSchema.safeParse({
      id: 'alb-1',
      artistId: 'art-1',
      title: 'Nuit',
      description: null,
      coverUrl: 'https://cdn.example/c.jpg',
      price: null,
      tracks: [
        {
          id: 't-1',
          title: 'Intro',
          genre: 'AFRO',
          price: null,
          coverUrl: null,
          durationMs: 120000,
          albumPosition: 0,
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });
});
