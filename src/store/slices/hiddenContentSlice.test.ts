import {
  clearHiddenContentState,
  hideReportedContent,
  hiddenContentReducer,
  setHiddenContentHydrated,
} from '@/store/slices/hiddenContentSlice';

describe('hiddenContentSlice', () => {
  it('hydrate les entrées pour un user', () => {
    const next = hiddenContentReducer(
      undefined,
      setHiddenContentHydrated({
        userId: 'u1',
        entries: [{ targetType: 'TRACK', targetId: 't1' }],
      }),
    );
    expect(next.userId).toBe('u1');
    expect(next.hydrated).toBe(true);
    expect(next.entries).toHaveLength(1);
  });

  it('ajoute un masquage sans doublon', () => {
    const hydrated = hiddenContentReducer(
      undefined,
      setHiddenContentHydrated({ userId: 'u1', entries: [] }),
    );
    const once = hiddenContentReducer(
      hydrated,
      hideReportedContent({ targetType: 'ALBUM', targetId: 'a1' }),
    );
    const twice = hiddenContentReducer(
      once,
      hideReportedContent({ targetType: 'ALBUM', targetId: 'a1' }),
    );
    expect(twice.entries).toHaveLength(1);
  });

  it('reset à la déconnexion', () => {
    const hydrated = hiddenContentReducer(
      undefined,
      setHiddenContentHydrated({
        userId: 'u1',
        entries: [{ targetType: 'ARTIST', targetId: 'art' }],
      }),
    );
    const cleared = hiddenContentReducer(hydrated, clearHiddenContentState());
    expect(cleared.entries).toEqual([]);
    expect(cleared.userId).toBeNull();
    expect(cleared.hydrated).toBe(false);
  });
});
