import { z } from 'zod';

import { userPublicProfileSchema, publicPlaylistSchema } from '@/schemas/users';

describe('schemas/users — profil public', () => {
  it('accepte un profil sans email', () => {
    const parsed = userPublicProfileSchema.safeParse({
      id: 'u1',
      username: 'alice',
      bio: null,
      avatarUrl: null,
      artistId: 'a1',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty('email');
    }
  });

  it('refuse un profil incomplet', () => {
    const parsed = userPublicProfileSchema.safeParse({
      id: 'u1',
      username: 'alice',
    });
    expect(parsed.success).toBe(false);
  });

  it('parse une playlist publique', () => {
    const parsed = z.array(publicPlaylistSchema).safeParse([
      { id: 'p1', name: 'Mix', trackCount: 2 },
    ]);
    expect(parsed.success).toBe(true);
  });
});
