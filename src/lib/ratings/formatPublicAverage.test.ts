import {
  formatPublicAverageLabel,
  MIN_PUBLIC_RATING_VOTES,
} from '@/lib/ratings/formatPublicAverage';

describe('formatPublicAverageLabel', () => {
  it('masque sous le seuil de votes', () => {
    expect(
      formatPublicAverageLabel({
        average: 5,
        count: MIN_PUBLIC_RATING_VOTES - 1,
        myValue: 5,
      }),
    ).toBeNull();
  });

  it('affiche moyenne + count au-dessus du seuil', () => {
    expect(
      formatPublicAverageLabel({
        average: 4.3,
        count: MIN_PUBLIC_RATING_VOTES,
        myValue: null,
      }),
    ).toBe('★ 4,3 · 3');
  });
});
