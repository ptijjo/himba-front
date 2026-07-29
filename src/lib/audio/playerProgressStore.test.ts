import {
  getPlayerProgressSnapshot,
  resetPlayerProgress,
  setPlayerProgress,
  subscribePlayerProgress,
} from '@/lib/audio/playerProgressStore';

describe('playerProgressStore', () => {
  beforeEach(() => {
    resetPlayerProgress(0);
  });

  it('notifie les abonnés seulement si la valeur change', () => {
    const listener = jest.fn();
    const unsubscribe = subscribePlayerProgress(listener);

    setPlayerProgress({ currentTime: 1, duration: 10 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getPlayerProgressSnapshot()).toEqual({
      currentTime: 1,
      duration: 10,
    });

    setPlayerProgress({ currentTime: 1, duration: 10 });
    expect(listener).toHaveBeenCalledTimes(1);

    setPlayerProgress({ currentTime: 2, duration: 10 });
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    setPlayerProgress({ currentTime: 3, duration: 10 });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
