import { useCallback, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { himbaColors } from '@/constants/theme';
import type { AppNotification } from '@/schemas/notifications';

type NotificationSwipeRowProps = {
  item: AppNotification;
  unread: boolean;
  dateLabel: string;
  onPress: () => void;
  onOpenMenu: () => void;
  onDelete: () => void;
};

function DeleteAction() {
  return (
    <View
      className="min-w-[96px] items-center justify-center px-4"
      style={{ backgroundColor: himbaColors.alert }}
    >
      <Text className="font-semibold text-himba-ink">Supprimer</Text>
    </View>
  );
}

/**
 * Ligne Actus — swipe gauche ou droite pour supprimer (ReanimatedSwipeable).
 * activeOffsetX / failOffsetY : le scroll vertical de la liste reste prioritaire.
 */
export function NotificationSwipeRow({
  item,
  unread,
  dateLabel,
  onPress,
  onOpenMenu,
  onDelete,
}: NotificationSwipeRowProps) {
  const swipeRef = useRef<SwipeableMethods | null>(null);
  const deletingRef = useRef(false);

  const triggerDelete = useCallback(() => {
    if (deletingRef.current) {
      return;
    }
    deletingRef.current = true;
    onDelete();
  }, [onDelete]);

  const renderDelete = useCallback(() => <DeleteAction />, []);

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      leftThreshold={56}
      rightThreshold={56}
      overshootFriction={8}
      // Distance avant activation du swipe (scroll vertical reste fluide)
      dragOffsetFromLeftEdge={24}
      dragOffsetFromRightEdge={24}
      renderLeftActions={renderDelete}
      renderRightActions={renderDelete}
      onSwipeableOpen={() => {
        triggerDelete();
      }}
      containerStyle={{ borderRadius: 16, overflow: 'hidden' }}
    >
      <View
        className={`min-h-[72px] flex-row items-stretch ${
          unread ? 'bg-himba-earth' : 'bg-himba-earth/40'
        }`}
        style={
          unread
            ? { borderLeftWidth: 3, borderLeftColor: himbaColors.ember }
            : undefined
        }
      >
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityState={{ selected: unread }}
          accessibilityLabel={`${unread ? 'Non lue. ' : 'Déjà vue. '}${item.title}. ${item.body}. Glisser pour supprimer`}
          className="min-h-[72px] flex-1 flex-row items-start gap-3 px-3 py-3 pr-1"
        >
          <View className="w-3 items-center pt-2">
            {unread ? (
              <View
                className="h-3 w-3 rounded-full bg-himba-ember"
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
            ) : null}
          </View>
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <Text
                className={`flex-1 text-himba-ink ${
                  unread ? 'font-bold' : 'font-normal opacity-70'
                }`}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {unread ? (
                <Text className="text-[10px] font-bold uppercase tracking-wide text-himba-ember">
                  Nouveau
                </Text>
              ) : null}
            </View>
            <Text
              className={`text-himba-mist ${
                unread ? 'font-semibold' : 'font-normal opacity-70'
              }`}
            >
              {item.body}
            </Text>
            <Text className="text-xs text-himba-mist">{dateLabel}</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={onOpenMenu}
          accessibilityRole="button"
          accessibilityLabel={`Options pour ${item.title}`}
          hitSlop={8}
          className="min-h-[44px] min-w-[44px] items-center justify-center px-3"
        >
          <Text className="text-xl leading-none text-himba-mist">⋮</Text>
        </Pressable>
      </View>
    </Swipeable>
  );
}
