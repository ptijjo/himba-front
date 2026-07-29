/**
 * Active refetchOnFocus pour React Native.
 * Le handler web par défaut (window focus) ne s’applique pas — on utilise AppState.
 */
import { setupListeners } from '@reduxjs/toolkit/query';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { AppState, type NativeEventSubscription } from 'react-native';

type ListenerDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

export function setupRtkListeners(dispatch: ListenerDispatch): () => void {
  return setupListeners(dispatch, (dispatchFn, { onFocus, onFocusLost }) => {
    let subscription: NativeEventSubscription | undefined;

    // 1. Premier passage : écouter le passage avant-plan / arrière-plan.
    subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        dispatchFn(onFocus());
      } else if (nextState === 'background' || nextState === 'inactive') {
        dispatchFn(onFocusLost());
      }
    });

    // 2. Cleanup quand setupListeners est retiré.
    return () => {
      subscription?.remove();
      subscription = undefined;
    };
  });
}
