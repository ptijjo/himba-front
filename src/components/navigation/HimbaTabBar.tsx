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

import { himbaColors } from '@/constants/theme';
import { canPublishMusic } from '@/lib/auth/canPublishMusic';
import { useAppSelector } from '@/store';

const VISIBLE_TABS = ['index', 'library', 'explore', 'profile'] as const;

const TAB_LABELS: Record<(typeof VISIBLE_TABS)[number], string> = {
  index: 'Accueil',
  library: 'Musique',
  explore: 'Actus',
  profile: 'Profil',
};

/**
 * Tab bar — Accueil | Musique | ＋ | Actus | Profil (couleurs Himba).
 */
export function HimbaTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const role = useAppSelector((s) => s.auth.user?.role);
  const showPublish = canPublishMusic(role);
  const bottomPad = Math.max(insets.bottom, 8);

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
    const focused = state.index === index;
    const { options } = descriptors[route.key] ?? {
      options: {},
    };
    const color = focused ? himbaColors.ember : himbaColors.mist;
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
      if (!focused && !event.defaultPrevented) {
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
          options.tabBarAccessibilityLabel ?? label
        }
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.slot}
        hitSlop={4}
      >
        <View style={styles.tabInner}>
          {icon}
          <Text
            style={[styles.label, focused ? styles.labelActive : null]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    );
  };

  const onPublish = (_event: GestureResponderEvent) => {
    router.push('/(app)/studio');
  };

  return (
    <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
      <View style={styles.bar}>
        {left.map((route) => renderTab(route.name))}

        <View style={styles.centerSlot}>
          {showPublish ? (
            <Pressable
              onPress={onPublish}
              accessibilityRole="button"
              accessibilityLabel="Publier une musique"
              style={styles.publishBtn}
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
    paddingTop: 6,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 4,
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
    gap: 4,
    minHeight: 48,
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
  publishPlus: {
    fontSize: 28,
    fontWeight: '700',
    color: himbaColors.ink,
    marginTop: -2,
  },
});
