import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { HimbaTabBar } from '@/components/navigation/HimbaTabBar';
import { himbaColors } from '@/constants/theme';

/** Maison — Accueil. */
function HomeIcon({ color }: { color: string }) {
  return (
    <View style={[styles.homeRoofWrap]}>
      <View style={[styles.homeRoof, { borderBottomColor: color }]} />
      <View style={[styles.homeBody, { borderColor: color }]}>
        <View style={[styles.homeDoor, { borderColor: color }]} />
      </View>
    </View>
  );
}

/** Disque — Ma musique (lecture / playlists / favoris). */
function DiscIcon({ color }: { color: string }) {
  return (
    <View style={[styles.discOuter, { borderColor: color }]}>
      <View style={[styles.discInner, { borderColor: color }]} />
      <View
        style={[
          styles.discGroove,
          { backgroundColor: color, transform: [{ rotate: '35deg' }] },
        ]}
      />
    </View>
  );
}

/** Cloche — Actus / notifications. */
function BellIcon({ color }: { color: string }) {
  return (
    <View style={styles.bellWrap}>
      <View style={[styles.bellBody, { borderColor: color }]} />
      <View style={[styles.bellClapper, { backgroundColor: color }]} />
    </View>
  );
}

/** Silhouette — Profil. */
function ProfileIcon({ color }: { color: string }) {
  return (
    <View style={styles.profileWrap}>
      <View style={[styles.profileHead, { borderColor: color }]} />
      <View style={[styles.profileBody, { borderColor: color }]} />
    </View>
  );
}

export default function AppTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <HimbaTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: himbaColors.ember,
        tabBarInactiveTintColor: himbaColors.mist,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarAccessibilityLabel: 'Accueil',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          href: null,
          title: 'Accueil',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Musique',
          tabBarAccessibilityLabel: 'Ma musique',
          tabBarIcon: ({ color }) => <DiscIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="bibliotheque"
        options={{
          href: null,
          title: 'Bibliothèque',
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
          title: 'Favoris',
        }}
      />
      <Tabs.Screen
        name="playlist/[id]"
        options={{
          href: null,
          title: 'Playlist',
        }}
      />
      <Tabs.Screen
        name="artist/[id]"
        options={{
          href: null,
          title: 'Artiste',
        }}
      />
      <Tabs.Screen
        name="user/[id]"
        options={{
          href: null,
          title: 'Profil public',
        }}
      />
      <Tabs.Screen
        name="studio"
        options={{
          href: null,
          title: 'Studio',
        }}
      />
      <Tabs.Screen
        name="edit-track/[id]"
        options={{
          href: null,
          title: 'Modifier le titre',
        }}
      />
      <Tabs.Screen
        name="edit-album/[id]"
        options={{
          href: null,
          title: 'Modifier l’album',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Actus',
          tabBarAccessibilityLabel: 'Actus',
          tabBarIcon: ({ color }) => <BellIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarAccessibilityLabel: 'Profil',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  homeRoofWrap: {
    width: 22,
    height: 20,
    alignItems: 'center',
  },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  homeBody: {
    width: 16,
    height: 11,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 1,
  },
  homeDoor: {
    width: 5,
    height: 6,
    borderWidth: 1.2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  discOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
  },
  discGroove: {
    position: 'absolute',
    width: 7,
    height: 1.3,
    top: 3.5,
    right: 2,
    borderRadius: 1,
  },
  bellWrap: {
    width: 18,
    height: 20,
    alignItems: 'center',
  },
  bellBody: {
    width: 14,
    height: 13,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    borderWidth: 1.5,
    marginTop: 1,
  },
  bellClapper: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    marginTop: 1,
  },
  profileWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  profileHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    marginBottom: 1.5,
  },
  profileBody: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.5,
    borderBottomWidth: 0,
  },
});
