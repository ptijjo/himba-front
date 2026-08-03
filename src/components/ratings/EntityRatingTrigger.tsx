import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { RateEntitySheet } from '@/components/ratings/RateEntitySheet';
import { formatPublicAverageLabel } from '@/lib/ratings/formatPublicAverage';
import type { RatingSummary, UpsertRatingBody } from '@/schemas/ratings';
import { himbaColors } from '@/constants/theme';

type EntityRatingTriggerProps = {
  summary?: RatingSummary | null;
  target: Omit<UpsertRatingBody, 'value'>;
  sheetTitle?: string;
  /** Alignement du trigger (lecteur = center). */
  align?: 'center' | 'start';
};

/**
 * Ligne compacte ★ moyenne (ou « Noter ») → ouvre le sheet de notation.
 */
export function EntityRatingTrigger({
  summary,
  target,
  sheetTitle,
  align = 'start',
}: EntityRatingTriggerProps) {
  const [open, setOpen] = useState(false);
  const publicAvg = formatPublicAverageLabel(summary);
  const myValue = summary?.myValue ?? null;

  let label: string;
  if (publicAvg) {
    label = publicAvg;
  } else if (myValue != null) {
    label = `Ta note · ${myValue}/5`;
  } else {
    label = 'Noter';
  }

  return (
    <View style={{ alignItems: align === 'center' ? 'center' : 'flex-start' }}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}. Ouvrir pour noter ou modifier`}
        hitSlop={8}
        className="min-h-[44px] justify-center px-1"
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color:
              publicAvg || myValue != null
                ? himbaColors.saffron
                : himbaColors.mist,
          }}
        >
          {label}
        </Text>
      </Pressable>

      <RateEntitySheet
        visible={open}
        onClose={() => setOpen(false)}
        title={sheetTitle}
        summary={summary}
        target={target}
      />
    </View>
  );
}
