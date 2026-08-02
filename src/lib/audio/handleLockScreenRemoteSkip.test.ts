import type { Track } from '@/schemas/tracks';

const baseTrack = (id: string): Track => ({
  id,
  title: `t-${id}`,
  price: null,
  artistId: 'a1',
});

jest.mock('@/lib/audio/playTrackCore', () => ({
  playTrackCore: jest.fn(() => Promise.resolve()),
}));

const mockPlayerState = {
  track: baseTrack('1') as Track,
  queue: [baseTrack('1'), baseTrack('2'), baseTrack('3')] as Track[],
  shuffle: false,
  repeatMode: 'off' as const,
};

jest.mock('@/store', () => ({
  store: {
    getState: () => ({
      player: mockPlayerState,
    }),
  },
}));

import { handleLockScreenRemoteSkip, resetLockScreenRemoteSkipCooldown } from '@/lib/audio/handleLockScreenRemoteSkip';
import { playTrackCore } from '@/lib/audio/playTrackCore';

describe('handleLockScreenRemoteSkip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLockScreenRemoteSkipCooldown();
    mockPlayerState.track = mockPlayerState.queue[0]!;
  });

  it('next → playTrackCore sur le voisin suivant', () => {
    handleLockScreenRemoteSkip('next');
    expect(playTrackCore).toHaveBeenCalledWith(
      expect.objectContaining({ id: '2' }),
      expect.any(Array),
    );
  });

  it('prev depuis le 2e → titre précédent', () => {
    mockPlayerState.track = mockPlayerState.queue[1]!;
    handleLockScreenRemoteSkip('prev');
    expect(playTrackCore).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1' }),
      expect.any(Array),
    );
  });

  it('en fin de file sans repeat → ne joue pas', () => {
    mockPlayerState.track = mockPlayerState.queue[2]!;
    handleLockScreenRemoteSkip('next');
    expect(playTrackCore).not.toHaveBeenCalled();
  });
});
