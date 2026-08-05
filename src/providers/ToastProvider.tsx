import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { himbaColors } from '@/constants/theme';

type ToastKind = 'success' | 'error' | 'info';

type ToastPayload = {
  message: string;
  kind?: ToastKind;
};

type ToastContextValue = {
  showToast: (payload: ToastPayload | string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 2800;

/**
 * Toasts légers en haut d’écran — succès / erreur / info.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{
    message: string;
    kind: ToastKind;
  } | null>(null);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-12);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    opacity.value = withTiming(0, { duration: 180 }, (finished) => {
      if (finished) {
        runOnJS(setToast)(null);
      }
    });
    translateY.value = withTiming(-12, { duration: 180 });
  }, [clearTimer, opacity, translateY]);

  const showToast = useCallback(
    (payload: ToastPayload | string) => {
      const message =
        typeof payload === 'string' ? payload : payload.message;
      const kind =
        typeof payload === 'string' ? 'success' : (payload.kind ?? 'success');
      clearTimer();
      setToast({ message, kind });
      opacity.value = 0;
      translateY.value = -12;
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
      hideTimer.current = setTimeout(() => {
        hide();
      }, AUTO_DISMISS_MS);
    },
    [clearTimer, hide, opacity, translateY],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const value = useMemo(() => ({ showToast }), [showToast]);

  const bg =
    toast?.kind === 'error'
      ? himbaColors.alert
      : toast?.kind === 'info'
        ? himbaColors.canopy
        : himbaColors.ember;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            {
              position: 'absolute',
              left: 16,
              right: 16,
              top: insets.top + 8,
              zIndex: 9999,
            },
            animatedStyle,
          ]}
        >
          <Pressable
            onPress={hide}
            accessibilityRole="button"
            accessibilityLabel={toast.message}
            style={{
              backgroundColor: bg,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 12,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text
              className="text-center text-sm font-semibold text-himba-ink"
              numberOfLines={3}
            >
              {toast.message}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast doit être utilisé sous ToastProvider');
  }
  return ctx;
}
