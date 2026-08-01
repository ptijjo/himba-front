/**
 * Cover lecteur — swipe horizontal type Deezer pour prev / next dans la file.
 * activeOffsetX + failOffsetY : le scroll vertical de l’écran Lecture reste fluide.
 */
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { himbaColors } from '@/constants/theme';

const SWIPE_THRESHOLD = 72;
const VELOCITY_THRESHOLD = 650;

type PlayerCoverSwipeProps = {
  coverUri: string;
  accessibilityLabel: string;
  /** false si un seul titre sans next/prev possible */
  canSwipe: boolean;
  onSwipeNext: () => void;
  onSwipePrev: () => void;
};

export function PlayerCoverSwipe({
  coverUri,
  accessibilityLabel,
  canSwipe,
  onSwipeNext,
  onSwipePrev,
}: PlayerCoverSwipeProps) {
  const { width: windowWidth } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const coverWidth = Math.max(windowWidth - 40, 1);

  useEffect(() => {
    translateX.value = 0;
  }, [coverUri, translateX]);

  const pan = Gesture.Pan()
    .enabled(canSwipe)
    .activeOffsetX([-24, 24])
    .failOffsetY([-18, 18])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const goNext =
        e.translationX < -SWIPE_THRESHOLD || e.velocityX < -VELOCITY_THRESHOLD;
      const goPrev =
        e.translationX > SWIPE_THRESHOLD || e.velocityX > VELOCITY_THRESHOLD;

      if (goNext) {
        // Déclencher le changement tout de suite — ne pas attendre la fin du spring
        runOnJS(onSwipeNext)();
        translateX.value = withSpring(0, { damping: 22, stiffness: 280 });
        return;
      }
      if (goPrev) {
        runOnJS(onSwipePrev)();
        translateX.value = withSpring(0, { damping: 22, stiffness: 280 });
        return;
      }
      translateX.value = withSpring(0, { damping: 20, stiffness: 240 });
    });

  const coverStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        scale: interpolate(
          Math.abs(translateX.value),
          [0, coverWidth],
          [1, 0.94],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, coverWidth],
      [1, 0.55],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View style={styles.clip} accessibilityLabel={accessibilityLabel}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.coverWrap, coverStyle]}>
          <Image
            source={{ uri: coverUri }}
            style={styles.cover}
            contentFit="cover"
            accessibilityLabel={accessibilityLabel}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: himbaColors.earth,
  },
  coverWrap: {
    width: '100%',
    height: '100%',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
});
