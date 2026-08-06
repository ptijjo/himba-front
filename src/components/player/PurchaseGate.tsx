import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { formatTrackPriceEuros } from '@/constants/pricing';
import { usePurchaseTrack } from '@/hooks/usePurchaseTrack';
import type { Track } from '@/schemas/tracks';

type PurchaseGateProps = {
  track: Track;
  /** Variante compacte (mini-lecteur) vs carte lecteur plein. */
  compact?: boolean;
};

/**
 * CTA achat quand le stream renvoie 403 (titre payant sans Purchase).
 */
export function PurchaseGate({ track, compact = false }: PurchaseGateProps) {
  const { purchaseTrack, isLoading, error, clearError } = usePurchaseTrack();
  const priceLabel =
    track.price != null ? formatTrackPriceEuros(track.price) : null;

  if (compact) {
    return (
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => {
            clearError();
            void purchaseTrack(track);
          }}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={
            priceLabel ? `Acheter pour ${priceLabel}` : 'Acheter ce titre'
          }
          className={`min-h-10 items-center justify-center rounded-full bg-himba-ember px-4 ${
            isLoading ? 'opacity-50' : ''
          }`}
        >
          <Text className="text-sm font-semibold text-himba-ink">
            {isLoading ? '…' : priceLabel ? `Acheter ${priceLabel}` : 'Acheter'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-2xl border border-himba-ochre/40 bg-himba-earth p-4">
      <Text className="text-base font-bold text-himba-ink">Titre payant</Text>
      <Text className="text-sm leading-5 text-himba-mist">
        Ce morceau est en vente
        {priceLabel ? ` à ${priceLabel}` : ''}. L’achat débloque l’écoute et le
        téléchargement.
      </Text>
      <Button
        label={priceLabel ? `Acheter — ${priceLabel}` : 'Acheter'}
        loading={isLoading}
        disabled={isLoading}
        onPress={() => {
          clearError();
          void purchaseTrack(track);
        }}
      />
      {error ? (
        <Text className="text-center text-sm text-himba-alert">{error}</Text>
      ) : null}
    </View>
  );
}
