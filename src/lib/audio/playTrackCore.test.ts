import { playTrackCore } from '@/lib/audio/playTrackCore';
import {
  getCachedStreamUrl,
  setCachedStreamUrl,
} from '@/lib/audio/streamUrlCache';
import type { Track } from '@/schemas/tracks';
import { store } from '@/store';
import { tracksApi } from '@/store/api/tracksApi';
import {
  setNeedsPurchase,
  setNowPlaying,
  setPlayerError,
  setQueue,
} from '@/store/slices/playerSlice';

jest.mock('@/lib/audio/streamUrlCache', () => ({
  getCachedStreamUrl: jest.fn(),
  setCachedStreamUrl: jest.fn(),
}));

jest.mock('@/store', () => ({
  store: {
    dispatch: jest.fn(),
    getState: jest.fn(),
  },
}));

jest.mock('@/store/api/tracksApi', () => ({
  tracksApi: {
    endpoints: {
      getStreamUrl: { initiate: jest.fn() },
      recordPlay: { initiate: jest.fn() },
    },
  },
}));

jest.mock('@/store/slices/playerSlice', () => ({
  setQueue: jest.fn((p) => ({ type: 'player/setQueue', payload: p })),
  setNowPlaying: jest.fn((p) => ({ type: 'player/setNowPlaying', payload: p })),
  setNeedsPurchase: jest.fn((p) => ({
    type: 'player/setNeedsPurchase',
    payload: p,
  })),
  setPlayerError: jest.fn((p) => ({
    type: 'player/setPlayerError',
    payload: p,
  })),
}));

const track: Track = {
  id: 't1',
  title: 'Titre',
  price: null,
  artistId: 'a1',
  artist: { id: 'a1', displayName: 'Artiste' },
};

describe('playTrackCore', () => {
  const dispatch = store.dispatch as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (getCachedStreamUrl as jest.Mock).mockReturnValue(null);
    (tracksApi.endpoints.getStreamUrl.initiate as jest.Mock).mockReturnValue(
      'INIT_STREAM',
    );
    (tracksApi.endpoints.recordPlay.initiate as jest.Mock).mockReturnValue(
      'INIT_PLAY',
    );
    dispatch.mockImplementation((arg: unknown) => {
      if (arg === 'INIT_STREAM') {
        return Promise.resolve({
          data: { url: 'https://api/stream', expiresInSeconds: 60 },
        });
      }
      if (arg === 'INIT_PLAY') {
        return Promise.resolve({});
      }
      return arg;
    });
  });

  it('utilise le cache stream et hydrate le player', async () => {
    (getCachedStreamUrl as jest.Mock).mockReturnValue('https://cdn/x.m4a');

    await playTrackCore(track);

    expect(setQueue).toHaveBeenCalledWith([track]);
    expect(setNowPlaying).toHaveBeenCalledWith({
      track,
      streamUrl: 'https://cdn/x.m4a',
    });
    expect(tracksApi.endpoints.recordPlay.initiate).toHaveBeenCalledWith({
      trackId: 't1',
    });
    expect(tracksApi.endpoints.getStreamUrl.initiate).not.toHaveBeenCalled();
  });

  it('fetch stream si cache miss', async () => {
    await playTrackCore(track, [track]);

    expect(setQueue).toHaveBeenCalledWith([track]);
    expect(setCachedStreamUrl).toHaveBeenCalledWith(
      't1',
      'https://api/stream',
      60,
    );
    expect(setNowPlaying).toHaveBeenCalledWith({
      track,
      streamUrl: 'https://api/stream',
    });
  });

  it('mappe 403 → needsPurchase', async () => {
    dispatch.mockImplementation((arg: unknown) => {
      if (arg === 'INIT_STREAM') {
        return Promise.resolve({ error: { status: 403 } });
      }
      return arg;
    });

    await playTrackCore(track);

    expect(setNeedsPurchase).toHaveBeenCalledWith({ track });
    expect(setNowPlaying).not.toHaveBeenCalled();
  });

  it('mappe erreur générique → setPlayerError', async () => {
    dispatch.mockImplementation((arg: unknown) => {
      if (arg === 'INIT_STREAM') {
        return Promise.resolve({ error: { status: 500 } });
      }
      return arg;
    });

    await playTrackCore(track);

    expect(setPlayerError).toHaveBeenCalled();
  });
});
