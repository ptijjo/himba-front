import { useCallback, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import {
  ARTIST_TERMS_BODY,
  ARTIST_TERMS_TITLE,
  ARTIST_TERMS_VERSION,
} from '@/constants/artistTerms';
import { himbaColors } from '@/constants/theme';

const SCROLL_END_PAD = 28;

type ArtistTermsGateProps = {
  accepted: boolean;
  onAcceptedChange: (value: boolean) => void;
  error?: string;
};

/**
 * Texte CGU / règlement artiste : case cochable seulement après scroll en bas
 * (ou si le contenu tient sans scroll).
 */
export function ArtistTermsGate({
  accepted,
  onAcceptedChange,
  error,
}: ArtistTermsGateProps) {
  const [canAccept, setCanAccept] = useState(false);
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);

  const unlockIfFits = useCallback((viewH: number, contH: number) => {
    if (viewH > 0 && contH > 0 && contH <= viewH + SCROLL_END_PAD) {
      setCanAccept(true);
    }
  }, []);

  const onViewportLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setViewportH(h);
    unlockIfFits(h, contentH);
  };

  const onContentSizeChange = (_w: number, h: number) => {
    setContentH(h);
    unlockIfFits(viewportH, h);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (canAccept) {
      return;
    }
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const atBottom =
      contentOffset.y + layoutMeasurement.height >=
      contentSize.height - SCROLL_END_PAD;
    if (atBottom) {
      setCanAccept(true);
    }
  };

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-himba-ink">
        {ARTIST_TERMS_TITLE}
      </Text>
      <Text className="text-xs text-himba-mist">
        Version {ARTIST_TERMS_VERSION} · fais défiler jusqu’en bas pour pouvoir
        accepter
      </Text>

      <View
        className="overflow-hidden rounded-xl border border-himba-ochre/40"
        style={{ height: 180, backgroundColor: himbaColors.night }}
        onLayout={onViewportLayout}
      >
        <ScrollView
          nestedScrollEnabled
          onScroll={onScroll}
          scrollEventThrottle={16}
          onContentSizeChange={onContentSizeChange}
          contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
          showsVerticalScrollIndicator
        >
          <Text className="text-sm leading-5 text-himba-mist">
            {ARTIST_TERMS_BODY}
          </Text>
        </ScrollView>
      </View>

      {!canAccept ? (
        <Text className="text-xs text-himba-saffron">
          Continue jusqu’en bas du texte pour débloquer la case.
        </Text>
      ) : null}

      <Pressable
        onPress={() => {
          if (!canAccept) {
            return;
          }
          onAcceptedChange(!accepted);
        }}
        disabled={!canAccept}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted, disabled: !canAccept }}
        accessibilityLabel="J’ai lu et j’accepte les conditions artiste"
        accessibilityHint={
          canAccept
            ? undefined
            : 'Fais défiler le texte jusqu’en bas avant de cocher'
        }
        className={`min-h-[48px] flex-row items-start gap-3 rounded-xl px-2 py-2 ${
          canAccept ? '' : 'opacity-50'
        }`}
      >
        <View
          className={`mt-0.5 h-6 w-6 items-center justify-center rounded-md border ${
            accepted
              ? 'border-himba-ember bg-himba-ember'
              : 'border-himba-mist bg-transparent'
          }`}
        >
          {accepted ? (
            <Text className="text-xs font-bold text-himba-ink">✓</Text>
          ) : null}
        </View>
        <Text className="flex-1 text-sm leading-5 text-himba-ink">
          J’ai parcouru et j’accepte les conditions générales et le règlement
          artiste (texte provisoire).
        </Text>
      </Pressable>

      {error ? <Text className="text-sm text-himba-alert">{error}</Text> : null}
    </View>
  );
}
