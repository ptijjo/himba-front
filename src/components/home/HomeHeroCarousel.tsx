import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { himbaColors, homeMedia } from '@/constants/theme';
import type { Track } from '@/schemas/tracks';

const CARD_HEIGHT = 300;
const AUTO_MS = 4500;
const MAX_SLIDES = 6;

type HomeHeroCarouselProps = {
  tracks: Track[];
  onPlayTrack?: (track: Track) => void;
  /** Cover active → fond d’écran accueil. */
  onActiveImageChange?: (imageUri: string) => void;
};

type Slide = {
  key: string;
  track: Track | null;
  imageUri: string;
  title: string;
  /** Nom artiste (titres) — affiché sous le titre. */
  artistName: string | null;
  /** Genre ou texte éditorial. */
  meta: string;
};

function trackMetaLine(track: Track): {
  artistName: string | null;
  meta: string;
} {
  const artistName = track.artist?.displayName?.trim() || null;
  const genre = track.genre?.trim() || null;
  if (artistName && genre) {
    return { artistName, meta: genre };
  }
  if (artistName) {
    return { artistName, meta: track.price == null ? 'Écoute gratuite' : `${track.price.toFixed(2)} €` };
  }
  if (genre) {
    return { artistName: null, meta: genre };
  }
  return {
    artistName: null,
    meta:
      track.price == null ? 'Écoute gratuite' : `${track.price.toFixed(2)} €`,
  };
}

/**
 * Carrousel musiques récentes — slides = titres API uniquement (pas de slide marketing).
 * Pagination capsule (pastilles + pill active), sans chiffres.
 */
export function HomeHeroCarousel({
  tracks,
  onPlayTrack,
  onActiveImageChange,
}: HomeHeroCarouselProps) {
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [cardWidth, setCardWidth] = useState(windowWidth - 40);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const onActiveImageChangeRef = useRef(onActiveImageChange);
  onActiveImageChangeRef.current = onActiveImageChange;

  const slides = useMemo<Slide[]>(() => {
    return tracks.slice(0, MAX_SLIDES).map((track) => {
      const { artistName, meta } = trackMetaLine(track);
      return {
        key: track.id,
        track,
        imageUri: track.coverUrl ?? homeMedia.heroConcert,
        title: track.title,
        artistName,
        meta,
      };
    });
  }, [tracks]);

  useEffect(() => {
    const uri = slides[index]?.imageUri ?? homeMedia.heroConcert;
    onActiveImageChangeRef.current?.(uri);
  }, [index, slides]);

  // Si le catalogue change et que l’index dépasse → revenir au début.
  useEffect(() => {
    if (slides.length === 0) {
      setIndex(0);
      return;
    }
    if (index >= slides.length) {
      setIndex(0);
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [index, slides.length]);

  const goTo = useCallback(
    (next: number, animated = true) => {
      if (slides.length === 0) {
        return;
      }
      const clamped =
        ((next % slides.length) + slides.length) % slides.length;
      setIndex(clamped);
      scrollRef.current?.scrollTo({
        x: clamped * cardWidth,
        animated,
      });
    },
    [cardWidth, slides.length],
  );

  useEffect(() => {
    if (paused || slides.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      goTo(index + 1);
    }, AUTO_MS);

    return () => {
      clearInterval(timer);
    };
  }, [goTo, index, paused, slides.length]);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const next = Math.round(x / Math.max(cardWidth, 1));
    const clamped = Math.min(Math.max(next, 0), Math.max(slides.length - 1, 0));
    if (clamped !== index) {
      setIndex(clamped);
    }
  };

  if (slides.length === 0) {
    return (
      <View className="gap-2 overflow-hidden rounded-card bg-himba-earth px-5 py-8">
        <Text style={styles.eyebrow}>MUSIQUES RÉCENTES</Text>
        <Text className="text-base text-himba-mist">
          Aucun titre pour le moment — reviens dès qu’un artiste publie.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View
        className="overflow-hidden rounded-card"
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - cardWidth) > 1) {
            setCardWidth(w);
          }
        }}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          accessibilityRole="adjustable"
          accessibilityLabel="Carrousel musiques récentes"
        >
          {slides.map((slide) => (
            <View
              key={slide.key}
              style={{ width: cardWidth, height: CARD_HEIGHT }}
            >
              <Image
                source={{ uri: slide.imageUri }}
                style={{ width: cardWidth, height: CARD_HEIGHT }}
                contentFit="cover"
              />
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(255,102,0,0.14)',
                  'transparent',
                ]}
                locations={[0.2, 0.45, 0.6]}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={[
                  'rgba(11,6,24,0.1)',
                  'rgba(11,6,24,0.5)',
                  'rgba(11,6,24,0.94)',
                  himbaColors.night,
                ]}
                locations={[0, 0.38, 0.72, 1]}
                style={styles.overlay}
              >
                <View style={styles.copy}>
                  <Text style={styles.eyebrow}>MUSIQUES RÉCENTES</Text>
                  <Text
                    style={[styles.title, styles.titleTrack]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                  >
                    {slide.title}
                  </Text>
                  {slide.artistName ? (
                    <Text style={styles.artist} numberOfLines={1}>
                      {slide.artistName}
                    </Text>
                  ) : null}
                  <Text style={styles.subtitle} numberOfLines={2}>
                    {slide.meta}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    if (slide.track) {
                      onPlayTrack?.(slide.track);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    slide.track
                      ? `Écouter ${slide.track.title}`
                      : 'Écouter'
                  }
                  style={styles.play}
                >
                  <Text style={styles.playIcon}>▶</Text>
                </Pressable>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className="items-center">
        <View
          style={styles.pager}
          accessibilityRole="adjustable"
          accessibilityLabel={`Slide ${index + 1} sur ${slides.length}`}
          accessibilityValue={{
            min: 1,
            max: slides.length,
            now: index + 1,
          }}
        >
          {slides.map((slide, i) => {
            const active = i === index;
            return (
              <Pressable
                key={slide.key}
                onPress={() => goTo(i)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={active ? styles.dotActive : styles.dot}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  copy: {
    maxWidth: '88%',
    marginBottom: 14,
  },
  eyebrow: {
    marginBottom: 10,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.4,
    color: 'rgba(245,240,255,0.9)',
  },
  title: {
    color: himbaColors.ink,
    fontFamily: 'Literata_700Bold',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  titleTrack: {
    fontSize: 24,
    lineHeight: 30,
  },
  artist: {
    marginBottom: 4,
    fontSize: 15,
    fontWeight: '700',
    color: himbaColors.ink,
  },
  subtitle: {
    maxWidth: 280,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(245,240,255,0.85)',
  },
  play: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 2,
    fontSize: 16,
    color: himbaColors.night,
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});
