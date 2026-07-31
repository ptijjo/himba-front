import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { himbaColors } from '@/constants/theme';

type PlaylistCoverMosaicProps = {
  coverUrls: string[];
  /** Initiale si aucune cover. */
  fallbackLetter: string;
  size?: number;
};

/**
 * Cover playlist type Deezer :
 * - 0 → initiale
 * - 1 → image pleine
 * - 2–4 → mosaïque 2×2 (cases vides si < 4)
 */
export function PlaylistCoverMosaic({
  coverUrls,
  fallbackLetter,
  size = 128,
}: PlaylistCoverMosaicProps) {
  const urls = coverUrls.slice(0, 4);

  if (urls.length === 0) {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <Text style={styles.initial}>
          {fallbackLetter.trim().charAt(0).toUpperCase() || 'P'}
        </Text>
      </View>
    );
  }

  if (urls.length === 1) {
    return (
      <View style={[styles.box, { width: size, height: size }]}>
        <Image
          source={{ uri: urls[0] }}
          style={{ width: size, height: size }}
          contentFit="cover"
        />
      </View>
    );
  }

  const cell = size / 2;

  return (
    <View style={[styles.box, styles.grid, { width: size, height: size }]}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.cell,
            { width: cell, height: cell, backgroundColor: himbaColors.canopy },
          ]}
        >
          {urls[i] ? (
            <Image
              source={{ uri: urls[i] }}
              style={{ width: cell, height: cell }}
              contentFit="cover"
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: himbaColors.canopy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  cell: {
    overflow: 'hidden',
  },
  initial: {
    fontSize: 40,
    fontWeight: '700',
    color: himbaColors.mist,
  },
});
