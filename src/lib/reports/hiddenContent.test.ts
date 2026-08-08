import {
  filterHiddenTracks,
  isAlbumHidden,
  isArtistHidden,
  isTrackHidden,
  toHiddenKeySet,
} from '@/lib/reports/hiddenContent';
import type { HiddenContentEntry } from '@/lib/reports/hiddenContentStorage';
import type { Track } from '@/schemas/tracks';

const track = (partial: Partial<Track> & Pick<Track, 'id' | 'title'>): Track => ({
  id: partial.id,
  title: partial.title,
  genre: null,
  price: null,
  coverUrl: null,
  artistId: partial.artistId ?? 'artist-1',
  albumId: partial.albumId ?? null,
  durationMs: null,
});

describe('hiddenContent filters', () => {
  it('masque un titre signalé', () => {
    const entries: HiddenContentEntry[] = [
      { targetType: 'TRACK', targetId: 't1' },
    ];
    const keys = toHiddenKeySet(entries);
    expect(isTrackHidden(track({ id: 't1', title: 'A' }), keys)).toBe(true);
    expect(isTrackHidden(track({ id: 't2', title: 'B' }), keys)).toBe(false);
  });

  it('cascade album → titres', () => {
    const keys = toHiddenKeySet([
      { targetType: 'ALBUM', targetId: 'alb1' },
    ]);
    expect(
      isTrackHidden(
        track({ id: 't1', title: 'A', albumId: 'alb1' }),
        keys,
      ),
    ).toBe(true);
    expect(isAlbumHidden({ id: 'alb1', artistId: 'a1' }, keys)).toBe(true);
  });

  it('cascade artiste → titres et albums', () => {
    const keys = toHiddenKeySet([
      { targetType: 'ARTIST', targetId: 'a9' },
    ]);
    expect(
      isTrackHidden(track({ id: 't1', title: 'A', artistId: 'a9' }), keys),
    ).toBe(true);
    expect(isAlbumHidden({ id: 'alb1', artistId: 'a9' }, keys)).toBe(true);
    expect(isArtistHidden('a9', keys)).toBe(true);
  });

  it('filtre une liste de titres', () => {
    const keys = toHiddenKeySet([
      { targetType: 'TRACK', targetId: 't2' },
    ]);
    const list = [
      track({ id: 't1', title: 'Keep' }),
      track({ id: 't2', title: 'Hide' }),
    ];
    expect(filterHiddenTracks(list, keys).map((t) => t.id)).toEqual(['t1']);
  });
});
