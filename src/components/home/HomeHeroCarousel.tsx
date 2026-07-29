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
 * Carrousel « À la une » auto — MVP (titres API + slide éditorial).
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
    const editorial: Slide = {
      key: 'editorial',
      track: null,
      imageUri: homeMedia.heroConcert,
      title: 'Des sons\nqui voyagent.',
      artistName: null,
      meta: 'Découvre les voix indépendantes, soutiens les artistes et compose ta playlist.',
    };

    const fromApi = tracks.slice(0, MAX_SLIDES - 1).map((track) => {
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

    return fromApi.length > 0 ? [editorial, ...fromApi] : [editorial];
  }, [tracks]);

  useEffect(() => {
    const uri = slides[index]?.imageUri ?? homeMedia.heroConcert;
    onActiveImageChangeRef.current?.(uri);
  }, [index, slides]);

  const goTo = useCallback(
    (next: number, animated = true) => {
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
    const clamped = Math.min(Math.max(next, 0), slides.length - 1);
    if (clamped !== index) {
      setIndex(clamped);
    }
  };

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
          accessibilityLabel="Carrousel à la une"
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
                  <Text style={styles.eyebrow}>À LA UNE · MUSIQUE</Text>
                  <Text
                    style={[
                      styles.title,
                      slide.track ? styles.titleTrack : styles.titleEditorial,
                    ]}
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
                    } else if (tracks[0]) {
                      onPlayTrack?.(tracks[0]);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    slide.track
                      ? `Écouter ${slide.track.title}`
                      : 'Lire la sélection'
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

      {/* Pagination style capsule : pastilles + pill active (sans chiffres) */}
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
  titleEditorial: {
    fontSize: 28,
    lineHeight: 34,
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
