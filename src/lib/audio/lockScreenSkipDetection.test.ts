import { detectLockScreenSkip } from '@/lib/audio/lockScreenSkipDetection';

describe('detectLockScreenSkip', () => {
  it('détecte seek +10 s → next', () => {
    expect(detectLockScreenSkip(30, 40)).toBe('next');
    expect(detectLockScreenSkip(0, 10)).toBe('next');
  });

  it('détecte seek -10 s → prev', () => {
    expect(detectLockScreenSkip(40, 30)).toBe('prev');
  });

  it('détecte rewind clampé près du début → prev', () => {
    expect(detectLockScreenSkip(4, 0)).toBe('prev');
  });

  it('ignore scrub libre (gros saut)', () => {
    expect(detectLockScreenSkip(60, 10)).toBeNull();
    expect(detectLockScreenSkip(10, 80)).toBeNull();
  });

  it('ignore petite progression normale', () => {
    expect(detectLockScreenSkip(10, 10.5)).toBeNull();
  });
});
