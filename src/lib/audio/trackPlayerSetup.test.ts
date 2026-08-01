const mockSetupPlayer = jest.fn().mockResolvedValue(undefined);
const mockUpdateOptions = jest.fn().mockResolvedValue(undefined);
const mockSetRepeatMode = jest.fn().mockResolvedValue(undefined);

jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    setupPlayer: (...args: unknown[]) => mockSetupPlayer(...args),
    updateOptions: (...args: unknown[]) => mockUpdateOptions(...args),
    setRepeatMode: (...args: unknown[]) => mockSetRepeatMode(...args),
  },
  Capability: {
    Play: 'play',
    Pause: 'pause',
    Stop: 'stop',
    SeekTo: 'seek',
    SkipToNext: 'next',
    SkipToPrevious: 'prev',
  },
  RepeatMode: { Off: 'off' },
  AppKilledPlaybackBehavior: { ContinuePlayback: 'continue-playback' },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

import { ensureTrackPlayerReady } from '@/lib/audio/trackPlayerSetup';

describe('ensureTrackPlayerReady', () => {
  it('configure setupPlayer + capabilities prev/next', async () => {
    await ensureTrackPlayerReady();

    expect(mockSetupPlayer).toHaveBeenCalledTimes(1);
    expect(mockUpdateOptions).toHaveBeenCalledTimes(1);
    const options = mockUpdateOptions.mock.calls[0]?.[0] as {
      capabilities: string[];
      compactCapabilities: string[];
    };
    expect(options.capabilities).toEqual(
      expect.arrayContaining(['next', 'prev', 'play', 'pause']),
    );
    expect(options.compactCapabilities).toEqual(
      expect.arrayContaining(['next', 'prev']),
    );
    expect(mockSetRepeatMode).toHaveBeenCalledWith('off');
  });
});
