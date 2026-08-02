import { parseUpsertRatingBody } from '@/store/api/ratingsApi';

describe('parseUpsertRatingBody', () => {
  it('accepte un corps valide', () => {
    expect(parseUpsertRatingBody({ value: 5, artistId: 'a1' })).toEqual({
      value: 5,
      artistId: 'a1',
    });
  });

  it('refuse sans cible', () => {
    expect(() => parseUpsertRatingBody({ value: 3 })).toThrow();
  });
});
