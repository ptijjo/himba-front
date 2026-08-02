import { useState } from 'react';
import { Text, View } from 'react-native';

import { StarRating } from '@/components/ratings/StarRating';
import { getErrorMessage } from '@/lib/errors/apiError';
import type { RatingSummary, UpsertRatingBody } from '@/schemas/ratings';
import { useUpsertRatingMutation } from '@/store/api/ratingsApi';

type EntityRatingBlockProps = {
  summary?: RatingSummary | null;
  target: Omit<UpsertRatingBody, 'value'>;
};

/**
 * Moyenne communautaire + note personnelle (modifiable via PUT upsert).
 */
export function EntityRatingBlock({ summary, target }: EntityRatingBlockProps) {
  const [upsertRating, { isLoading }] = useUpsertRatingMutation();
  const [error, setError] = useState<string | null>(null);

  const average = summary?.average ?? null;
  const count = summary?.count ?? 0;
  const myValue = summary?.myValue ?? null;

  const onRate = async (value: number) => {
    setError(null);
    try {
      await upsertRating({ ...target, value }).unwrap();
    } catch (e) {
      setError(getErrorMessage(e, 'Impossible d’enregistrer la note'));
    }
  };

  const averageLabel =
    average == null
      ? 'Pas encore de note'
      : `${average.toFixed(1)} · ${count} vote${count > 1 ? 's' : ''}`;

  return (
    <View className="gap-2">
      <View className="gap-1">
        <Text className="text-xs font-semibold uppercase tracking-wide text-himba-mist">
          Note moyenne
        </Text>
        <View className="flex-row flex-wrap items-center gap-2">
          <StarRating
            value={average ?? 0}
            size="sm"
            accessibilityLabel={averageLabel}
          />
          <Text className="text-sm text-himba-mist">{averageLabel}</Text>
        </View>
      </View>

      <View className="gap-1">
        <Text className="text-xs font-semibold uppercase tracking-wide text-himba-mist">
          {myValue == null
            ? 'Ta note'
            : 'Ta note · toucher pour modifier'}
        </Text>
        <StarRating
          value={myValue ?? 0}
          onChange={(v) => {
            void onRate(v);
          }}
          disabled={isLoading}
          accessibilityLabel={
            myValue == null
              ? 'Donner une note de 1 à 5'
              : `Ta note : ${myValue} sur 5`
          }
        />
      </View>

      {error ? (
        <Text className="text-sm text-himba-alert">{error}</Text>
      ) : null}
    </View>
  );
}
