import { userPurchasesResponseSchema } from '@/schemas/payments';

describe('payments schemas — historique achats', () => {
  it('parse un mix titre + album', () => {
    const parsed = userPurchasesResponseSchema.safeParse({
      items: [
        {
          kind: 'track',
          id: 'p1',
          amount: 1.99,
          createdAt: '2026-02-01T10:00:00.000Z',
          track: {
            id: 't1',
            title: 'Sunrise',
            coverUrl: null,
            artist: { id: 'a1', displayName: 'Nia' },
          },
        },
        {
          kind: 'album',
          id: 'p2',
          amount: '4.99',
          createdAt: '2026-01-01T10:00:00.000Z',
          album: {
            id: 'alb1',
            title: 'EP',
            coverUrl: 'https://cdn/x.webp',
          },
        },
      ],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items[0]?.kind).toBe('track');
      expect(parsed.data.items[1]?.amount).toBe(4.99);
    }
  });
});
