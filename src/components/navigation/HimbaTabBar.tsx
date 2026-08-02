import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/player/MiniPlayer';
import { himbaColors } from '@/constants/theme';
import { useUnreadNotificationsCount } from '@/hooks/useNotificationsLiveSync';
import { canPublishMusic } from '@/lib/auth/canPublishMusic';
import { useAppSelector } from '@/store';

const VISIBLE_TABS = ['index', 'bibliotheque', 'explore', 'profile'] as const;

const TAB_LABELS: Record<(typeof VISIBLE_TABS)[number], string> = {
  index: 'Accueil',
  bibliotheque: 'Musique',
  explore: 'Actus',
  profile: 'Profil',
};

/**
 * Tab bar — Accueil | Musique (bibliothèque) | ＋ | Actus | Profil.
 * Lecteur plein = route cachée `library` (via mini-lecteur).
 */
export function HimbaTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const role = useAppSelector((s) => s.auth.user?.role);
  const hasTrack = useAppSelector((s) => s.player.track != null);
  const unreadActus = useUnreadNotificationsCount();
  const showPublish = canPublishMusic(role);
  const bottomPad = Math.max(insets.bottom, 8);
  const focusedRoute = state.routes[state.index]?.name;
  // Mini visible partout sauf sur le lecteur plein (library)
  const showMiniPlayer = focusedRoute !== 'library' && hasTrack;
  // Sous-écrans liés à Musique → garder l’onglet Musique actif
  const musicSectionFocused =
    focusedRoute === 'bibliotheque' ||
    focusedRoute === 'library' ||
    focusedRoute === 'favorites' ||
    focusedRoute === 'library-albums' ||
    focusedRoute === 'library-artists' ||
    focusedRoute === 'album/[id]' ||
    focusedRoute === 'playlist/[id]';

  // Studio / édition → onglet Profil actif
  const profileSectionFocused =
    focusedRoute === 'profile' ||
    focusedRoute === 'studio' ||
    focusedRoute === 'edit-track/[id]' ||
    focusedRoute === 'edit-album/[id]';

  const visibleRoutes = state.routes.filter((route) =>
    (VISIBLE_TABS as readonly string[]).includes(route.name),
  );

  const left = visibleRoutes.slice(0, 2);
  const right = visibleRoutes.slice(2);

  const renderTab = (routeName: string) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) {
      return <View key={routeName} style={styles.slot} />;
    }
    const index = state.routes.findIndex((r) => r.key === route.key);
    const focused =
      routeName === 'bibliotheque'
        ? musicSectionFocused
        : routeName === 'profile'
          ? profileSectionFocused
          : state.index === index;
    const { options } = descriptors[route.key] ?? {
      options: {},
    };
    const color =
      routeName === 'explore' && unreadActus > 0 && !focused
        ? himbaColors.ember
        : focused
          ? himbaColors.ember
          : himbaColors.mist;
    const label =
      TAB_LABELS[routeName as (typeof VISIBLE_TABS)[number]] ??
      options.title ??
      route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (event.defaultPrevented) {
        return;
      }
      // Tap Musique → toujours la bibliothèque (pas le lecteur vide)
      if (routeName === 'bibliotheque') {
        navigation.navigate('bibliotheque');
        return;
      }
      if (
        routeName === 'profile' &&
        profileSectionFocused &&
        focusedRoute !== 'profile'
      ) {
        navigation.navigate('profile');
        return;
      }
      if (state.index !== index) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    const icon = options.tabBarIcon?.({
      focused,
      color,
      size: 22,
    });

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={
          routeName === 'explore' && unreadActus > 0
            ? `${label}, ${unreadActus} non lue${unreadActus > 1 ? 's' : ''}`
            : (options.tabBarAccessibilityLabel ?? label)
        }
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.slot}
        hitSlop={4}
      >
        <View style={styles.tabInner}>
          <View style={styles.iconWrap}>{icon}</View>
          {/* Compteur sous la cloche — masqué si 0 non-lue */}
          {routeName === 'explore' && unreadActus > 0 ? (
            <Text
              style={styles.underBellCount}
              accessibilityLabel={`${unreadActus} actualité${unreadActus > 1 ? 's' : ''} non lue${unreadActus > 1 ? 's' : ''}`}
            >
              {unreadActus > 99 ? '99+' : String(unreadActus)}
            </Text>
          ) : null}
          <Text
            style={[
              styles.label,
              focused || (routeName === 'explore' && unreadActus > 0)
                ? styles.labelActive
                : null,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    );
  };

  const onPublish = (_event: GestureResponderEvent) => {
    router.push('/(app)/(tabs)/studio');
  };

  return (
    <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
      {showMiniPlayer ? <MiniPlayer /> : null}
      <View style={styles.bar}>
        {left.map((route) => renderTab(route.name))}

        <View style={styles.centerSlot}>
          {showPublish ? (
            <Pressable
              onPress={onPublish}
              accessibilityRole="button"
              accessibilityLabel="Publier une musique"
              style={[
                styles.publishBtn,
                showMiniPlayer ? styles.publishBtnWithMini : null,
              ]}
              hitSlop={6}
            >
              <Text style={styles.publishPlus}>＋</Text>
            </Pressable>
          ) : (
            <View style={styles.centerSpacer} />
          )}
        </View>

        {right.map((route) => renderTab(route.name))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: himbaColors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(245,240,255,0.12)',
    paddingTop: 0,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 48,
  },
  iconWrap: {
    width: 28,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Compteur non-lues entre cloche et libellé Actus. */
  underBellCount: {
    minWidth: 16,
    marginTop: -1,
    marginBottom: -1,
    fontSize: 11,
    fontWeight: '800',
    color: himbaColors.ember,
    textAlign: 'center',
    lineHeight: 13,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: himbaColors.mist,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: himbaColors.ember,
    fontWeight: '700',
  },
  centerSlot: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
  },
  centerSpacer: {
    width: 48,
    height: 48,
  },
  publishBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: himbaColors.ember,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    elevation: 8,
    shadowColor: himbaColors.ember,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  /** Évite que le ＋ chevauche le mini-lecteur docké. */
  publishBtnWithMini: {
    marginTop: 0,
  },
  publishPlus: {
    fontSize: 28,
    fontWeight: '700',
    color: himbaColors.ink,
    marginTop: -2,
  },
});
