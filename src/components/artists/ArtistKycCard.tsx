/**
 * Carte profil — invite l’artiste à finaliser le KYC Stripe Connect.
 */
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import type { ArtistMe } from '@/schemas/artists';

type ArtistKycCardProps = {
  artist: ArtistMe;
  onStart: () => void;
  loading?: boolean;
  error?: string | null;
};

function kycCopy(artist: ArtistMe): { title: string; body: string; cta: string } {
  switch (artist.kycStatus) {
    case 'VERIFIED':
      return {
        title: 'Identité vérifiée',
        body: 'Ton compte Stripe est prêt — tu peux publier et encaisser.',
        cta: 'Rouvrir Stripe',
      };
    case 'RESTRICTED':
      return {
        title: 'Vérification incomplète',
        body:
          artist.stripeRequirementsDue.length > 0
            ? 'Stripe demande des infos supplémentaires pour activer les paiements.'
            : 'Finalise ton dossier Stripe pour publier et recevoir tes ventes.',
        cta: 'Continuer la vérification',
      };
    case 'PENDING':
      return {
        title: 'Vérifier mon identité',
        body: 'Pour publier et recevoir tes revenus, complète le parcours Stripe (KYC). C’est gratuit et sécurisé.',
        cta: 'Commencer avec Stripe',
      };
    default: {
      const _exhaustive: never = artist.kycStatus;
      return _exhaustive;
    }
  }
}

export function ArtistKycCard({
  artist,
  onStart,
  loading = false,
  error = null,
}: ArtistKycCardProps) {
  if (!artist.needsOnboarding && artist.kycStatus === 'VERIFIED') {
    return null;
  }

  const copy = kycCopy(artist);

  return (
    <View className="gap-3 rounded-2xl border border-himba-ochre/40 bg-himba-earth px-4 py-4">
      <Text
        className="text-base text-himba-ink"
        style={{ fontFamily: 'Literata_700Bold' }}
      >
        {copy.title}
      </Text>
      <Text className="text-sm leading-5 text-himba-mist">{copy.body}</Text>
      {error ? (
        <Text className="text-sm text-himba-alert" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <Button
        label={copy.cta}
        loading={loading}
        onPress={onStart}
        accessibilityLabel={copy.cta}
      />
    </View>
  );
}
