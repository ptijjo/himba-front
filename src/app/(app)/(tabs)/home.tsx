import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Ancienne route Accueil — contenu déplacé vers l’onglet index.
 */
export default function HomeRedirect() {
  const params = useLocalSearchParams<{ tab?: string }>();
  if (
    params.tab === 'explorer' ||
    params.tab === 'suivis' ||
    params.tab === 'pour-toi'
  ) {
    return (
      <Redirect
        href={{ pathname: '/(app)/(tabs)', params: { tab: params.tab } }}
      />
    );
  }
  return <Redirect href="/(app)/(tabs)" />;
}
