import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/player/MiniPlayer';

/**
 * Onglet cloche (maquette) — push hors MVP, écran placeholder.
 * Le catalogue reste dans Accueil → Explorer.
 */
export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-himba-night" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-3 px-5 pb-40 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[11px] font-bold tracking-[2px] text-himba-ember">
          ACTIVITÉ
        </Text>
        <Text
          className="text-3xl text-himba-ink"
          style={{ fontFamily: 'Literata_700Bold' }}
        >
          Notifications
        </Text>
        <Text className="text-himba-mist">
          Les alertes (nouvelles sorties, achats) arriveront ici. Hors MVP pour
          l’instant.
        </Text>
        <View className="mt-4 rounded-card bg-himba-earth p-5">
          <Text className="font-semibold text-himba-ink">Aucune alerte</Text>
          <Text className="mt-1 text-himba-mist">
            Suis des artistes pour ne rien manquer dès que les notifications
            seront actives.
          </Text>
        </View>
      </ScrollView>
      <MiniPlayer />
    </SafeAreaView>
  );
}
