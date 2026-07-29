import { canPublishMusic } from '@/lib/auth/canPublishMusic';

describe('canPublishMusic', () => {
  it('autorise ARTIST et ADMIN', () => {
    expect(canPublishMusic('ARTIST')).toBe(true);
    expect(canPublishMusic('ADMIN')).toBe(true);
  });

  it('refuse LISTENER et undefined', () => {
    expect(canPublishMusic('LISTENER')).toBe(false);
    expect(canPublishMusic(undefined)).toBe(false);
  });
});
