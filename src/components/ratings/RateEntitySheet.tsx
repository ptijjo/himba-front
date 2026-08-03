import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { StarRating } from '@/components/ratings/StarRating';
import { getErrorMessage } from '@/lib/errors/apiError';
import { formatPublicAverageLabel } from '@/lib/ratings/formatPublicAverage';
import type { RatingSummary, UpsertRatingBody } from '@/schemas/ratings';
import { useUpsertRatingMutation } from '@/store/api/ratingsApi';

type RateEntitySheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  summary?: RatingSummary | null;
  target: Omit<UpsertRatingBody, 'value'>;
};

/**
 * Sheet bas d’écran — noter / modifier (upsert).
 * La moyenne publique reste en lecture seule dans l’en-tête.
 */
export function RateEntitySheet({
  visible,
  onClose,
  title,
  summary,
  target,
}: RateEntitySheetProps) {
  const [upsertRating, { isLoading }] = useUpsertRatingMutation();
  const [error, setError] = useState<string | null>(null);

  const publicAvg = formatPublicAverageLabel(summary);
  const myValue = summary?.myValue ?? null;

  const onRate = async (value: number) => {
    setError(null);
    try {
      await upsertRating({ ...target, value }).unwrap();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e, 'Impossible d’enregistrer la note'));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 justify-end bg-black/55"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fermer"
      >
        <Pressable
          onPress={() => undefined}
          accessibilityViewIsModal
          className="rounded-t-3xl border-t border-himba-ochre/40 bg-himba-earth px-5 pb-10 pt-4"
        >
          <View className="mb-4 items-center">
            <View className="mb-3 h-1 w-10 rounded-full bg-himba-mist/50" />
            <Text className="text-center text-base font-semibold text-himba-ink">
              {title ?? 'Noter'}
            </Text>
            {publicAvg ? (
              <Text className="mt-1 text-sm text-himba-saffron">{publicAvg}</Text>
            ) : (
              <Text className="mt-1 text-sm text-himba-mist">
                Pas encore assez de votes publics
              </Text>
            )}
          </View>

          <Text className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-himba-mist">
            {myValue == null
              ? 'Ta note'
              : 'Ta note · toucher pour modifier'}
          </Text>
          <View className="items-center">
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
            <Text className="mt-3 text-center text-sm text-himba-alert">
              {error}
            </Text>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
