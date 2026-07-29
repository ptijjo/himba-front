import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { himbaColors } from '@/constants/theme';

type AtmosphereBackdropProps = {
  style?: StyleProp<ViewStyle>;
  /** Variante inspirée des refs design (auth / library). */
  variant?: 'auth' | 'library' | 'home';
  /** Cover album / titre — floutée derrière le contenu. */
  imageUri?: string | null;
};

/**
 * Fond atmosphérique — nuit Himba, ou cover album floutée (accueil / lecteur).
 */
export function AtmosphereBackdrop({
  style,
  variant = 'auth',
  imageUri,
}: AtmosphereBackdropProps) {
  const midGlow =
    variant === 'library'
      ? 'rgba(255,122,26,0.22)'
      : 'rgba(255,102,0,0.28)';

  if (imageUri) {
    return (
      <View style={[styles.wrap, style]} pointerEvents="none">
        <Image
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          blurRadius={28}
          transition={400}
        />
        <LinearGradient
          colors={[
            'rgba(11,6,24,0.55)',
            'rgba(11,6,24,0.72)',
            himbaColors.night,
          ]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', midGlow, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          locations={[0.15, 0.4, 0.7]}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      <LinearGradient
        colors={[himbaColors.night, '#160d28', himbaColors.night]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', midGlow, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        locations={[0.1, 0.4, 0.75]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(42,31,61,0.35)', 'transparent', himbaColors.night]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: himbaColors.night,
  },
});
