import { AppState } from 'react-native';

import { setupRtkListeners } from '@/store/setupRtkListeners';

jest.mock('@reduxjs/toolkit/query', () => ({
  setupListeners: jest.fn(
    (
      _dispatch: unknown,
      handler: (
        dispatch: (action: unknown) => unknown,
        actions: {
          onFocus: () => { type: string };
          onFocusLost: () => { type: string };
          onOnline: () => { type: string };
          onOffline: () => { type: string };
        },
      ) => () => void,
    ) => {
      const unsubscribe = handler(jest.fn(), {
        onFocus: () => ({ type: 'onFocus' }),
        onFocusLost: () => ({ type: 'onFocusLost' }),
        onOnline: () => ({ type: 'onOnline' }),
        onOffline: () => ({ type: 'onOffline' }),
      });
      return unsubscribe;
    },
  ),
}));

describe('setupRtkListeners', () => {
  const listeners: Array<(state: string) => void> = [];

  beforeEach(() => {
    listeners.length = 0;
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, listener) => {
        listeners.push(listener as (state: string) => void);
        return { remove: jest.fn() };
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('enregistre un listener AppState et le retire au cleanup', () => {
    // Arrange
    const dispatch = jest.fn();

    // Act
    const teardown = setupRtkListeners(dispatch);
    expect(AppState.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
    expect(listeners).toHaveLength(1);

    // Assert — cleanup ne doit pas lever
    expect(() => teardown()).not.toThrow();
  });
});
