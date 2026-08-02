import { Pressable, Text, View } from 'react-native';

import { himbaColors } from '@/constants/theme';

type StarRatingProps = {
  /** Note affichée (0 = aucune étoile remplie). */
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
};

const STAR_COUNT = 5;

/**
 * Rangée d’étoiles 1–5.
 * Avec `onChange` : interactif (upsert / modification).
 * Sans : lecture seule (moyenne arrondie visuelle).
 */
export function StarRating({
  value,
  onChange,
  disabled = false,
  size = 'md',
  accessibilityLabel = 'Note',
}: StarRatingProps) {
  const interactive = typeof onChange === 'function' && !disabled;
  const fontSize = size === 'sm' ? 22 : 28;
  const hit = size === 'sm' ? 40 : 44;
  const filled = Math.max(0, Math.min(STAR_COUNT, Math.round(value)));

  return (
    <View
      className="flex-row items-center"
      accessibilityRole={interactive ? 'adjustable' : 'text'}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={
        interactive
          ? { min: 1, max: 5, now: Math.max(0, Math.min(5, value)) }
          : undefined
      }
    >
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const starValue = i + 1;
        const isOn = starValue <= filled;
        const label = `${starValue} étoile${starValue > 1 ? 's' : ''}`;

        if (!interactive) {
          return (
            <Text
              key={starValue}
              style={{
                fontSize,
                color: isOn ? himbaColors.saffron : himbaColors.mist,
                width: hit * 0.7,
                textAlign: 'center',
              }}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {isOn ? '★' : '☆'}
            </Text>
          );
        }

        return (
          <Pressable
            key={starValue}
            onPress={() => onChange(starValue)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={4}
            className="items-center justify-center"
            style={{ minWidth: hit, minHeight: hit }}
          >
            <Text
              style={{
                fontSize,
                color: isOn ? himbaColors.saffron : himbaColors.mist,
              }}
            >
              {isOn ? '★' : '☆'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
