/**
 * Timeline lecteur — durée player ou métadonnées ; seek au tap / glissé
 * (compatible ScrollView parent).
 */
import { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from 'react-native';

import { himbaColors } from '@/constants/theme';
import {
  useAudioPlayerControls,
  useAudioPlayerProgress,
} from '@/providers/AudioPlayerProvider';

function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '0:00';
  }
  const sec = Math.floor(totalSeconds);
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}:${rem.toString().padStart(2, '0')}`;
}

export function PlayerSeekBar() {
  const { seekTo } = useAudioPlayerControls();
  const { currentTime, duration } = useAudioPlayerProgress();
  const trackWidthRef = useRef(0);
  const durationRef = useRef(duration);
  const seekToRef = useRef(seekTo);
  durationRef.current = duration;
  seekToRef.current = seekTo;

  const [scrubbing, setScrubbing] = useState(false);
  const [scrubSeconds, setScrubSeconds] = useState(0);

  // Si durée inconnue (stream), estimation par paliers pour garder une barre utilisable
  const barDuration =
    duration > 0
      ? duration
      : Math.max(30, Math.ceil(Math.max(currentTime, 1) / 30) * 30);
  const barDurationRef = useRef(barDuration);
  barDurationRef.current = barDuration;

  const secondsFromX = (locationX: number): number => {
    const width = trackWidthRef.current;
    const dur = barDurationRef.current;
    if (width <= 0 || dur <= 0) {
      return 0;
    }
    const ratio = Math.min(1, Math.max(0, locationX / width));
    return Math.round(ratio * dur);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        // Empêche le ScrollView parent de voler le geste
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          setScrubbing(true);
          setScrubSeconds(secondsFromX(e.nativeEvent.locationX));
        },
        onPanResponderMove: (e: GestureResponderEvent) => {
          setScrubSeconds(secondsFromX(e.nativeEvent.locationX));
        },
        onPanResponderRelease: (e: GestureResponderEvent) => {
          const seconds = secondsFromX(e.nativeEvent.locationX);
          setScrubSeconds(seconds);
          void seekToRef.current(seconds);
          setScrubbing(false);
        },
        onPanResponderTerminate: () => {
          setScrubbing(false);
        },
      }),
    [],
  );

  const displayTime = scrubbing ? scrubSeconds : currentTime;
  const progress =
    barDuration > 0
      ? Math.min(1, Math.max(0, displayTime / barDuration))
      : 0;
  const fillPercent = `${(Number.isFinite(progress) ? progress : 0) * 100}%`;
  const totalLabel = duration > 0 ? formatClock(duration) : formatClock(barDuration);

  const onLayout = (e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  };

  const onTap = (e: GestureResponderEvent) => {
    const seconds = secondsFromX(e.nativeEvent.locationX);
    void seekToRef.current(seconds);
  };

  return (
    <View style={styles.block}>
      <View style={styles.hit} onLayout={onLayout} {...panResponder.panHandlers}>
        <Pressable
          onPress={onTap}
          accessibilityRole="adjustable"
          accessibilityLabel="Position de lecture"
          accessibilityValue={{
            min: 0,
            max: Math.round(barDuration),
            now: Math.round(displayTime),
          }}
          style={styles.press}
        >
          <View style={styles.track}>
            <View style={[styles.fill, { width: fillPercent }]} />
          </View>
          <View
            pointerEvents="none"
            style={[styles.thumb, { left: fillPercent }]}
          />
        </Pressable>
      </View>
      <View style={styles.times}>
        <Text style={styles.time}>{formatClock(displayTime)}</Text>
        <Text style={styles.time}>{totalLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  hit: {
    height: 36,
    justifyContent: 'center',
  },
  press: {
    height: 36,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(245,240,255,0.2)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: himbaColors.ink,
    borderRadius: 999,
  },
  thumb: {
    position: 'absolute',
    marginLeft: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: himbaColors.ink,
    top: 11,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 12,
    color: himbaColors.mist,
  },
});
