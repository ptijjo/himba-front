import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { formatPublicAverageLabel } from '@/lib/ratings/formatPublicAverage';
import type { RatingSummary } from '@/schemas/ratings';
import { himbaColors } from '@/constants/theme';

type RatingAverageBadgeProps = {
  summary?: RatingSummary | null;
  /** Si true et pas assez de votes → affiche « Nouveau ». */
  showNewWhenEmpty?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Chip moyenne compacte — découverte / cartes catalogue.
 */
export function RatingAverageBadge({
  summary,
  showNewWhenEmpty = false,
  onPress,
  style,
}: RatingAverageBadgeProps) {
  const label = formatPublicAverageLabel(summary);
  const display = label ?? (showNewWhenEmpty ? 'Nouveau' : null);
  if (!display) {
    return null;
  }

  const content = (
    <Text
      style={{
        fontSize: 13,
        fontWeight: '600',
        color: label ? himbaColors.saffron : himbaColors.mist,
      }}
      accessibilityLabel={
        label
          ? `Note moyenne ${label}`
          : 'Nouveau titre, pas encore assez de notes'
      }
    >
      {display}
    </Text>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={8}
      style={[{ minHeight: 44, justifyContent: 'center' }, style]}
    >
      {content}
    </Pressable>
  );
}
