import { createAlbumSchema } from '@/schemas/albums';
import { trackGenreSchema, trackGenresListSchema } from '@/schemas/genres';

describe('genres / albums schemas', () => {
  it('valide un genre TrackGenre', () => {
    expect(trackGenreSchema.safeParse('AFRO').success).toBe(true);
    expect(trackGenreSchema.safeParse('INVALID').success).toBe(false);
  });

  it('valide la liste GET /tracks/genres', () => {
    const parsed = trackGenresListSchema.safeParse([
      { id: 'RAP', label: 'Rap' },
      { id: 'AFRO', label: 'Afro' },
    ]);
    expect(parsed.success).toBe(true);
  });

  it('valide createAlbum avec couverture', () => {
    expect(
      createAlbumSchema.safeParse({
        title: 'EP One',
        cover: {
          uri: 'file:///c.jpg',
          name: 'c.jpg',
          mimeType: 'image/jpeg',
        },
      }).success,
    ).toBe(true);
    expect(
      createAlbumSchema.safeParse({ title: 'EP', cover: null }).success,
    ).toBe(false);
    expect(createAlbumSchema.safeParse({ title: '' }).success).toBe(false);
  });
});
