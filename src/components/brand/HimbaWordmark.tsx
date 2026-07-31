import { Image } from 'expo-image';
import { Text, View } from 'react-native';

const logoSource = require('../../../assets/images/logo_dans_app.png');

type HimbaLogoProps = {
  size?: number;
};

/** Logo in-app (PNG transparent).
 * Store / splash : icon.png, adaptive-icon.png, splash-icon.png via app.json.
 */
export function HimbaLogo({ size = 40 }: HimbaLogoProps) {
  return (
    <Image
      source={logoSource}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityLabel="Logo Himba"
    />
  );
}

type HimbaWordmarkProps = {
  compact?: boolean;
};

export function HimbaWordmark({ compact = false }: HimbaWordmarkProps) {
  return (
    <View className="flex-row items-center gap-3">
      <HimbaLogo size={compact ? 40 : 52} />
      <Text
        className="font-bold tracking-wide text-himba-ink"
        style={{ fontSize: compact ? 18 : 22 }}
      >
        HIMBA
      </Text>
    </View>
  );
}
