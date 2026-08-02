import { Modal, Pressable, Text, View } from 'react-native';

export type TrackActionItem = {
  key: string;
  label: string;
  /** Style alerte (suppression). */
  destructive?: boolean;
  onPress: () => void;
};

type TrackActionsSheetProps = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  actions: TrackActionItem[];
  onClose: () => void;
};

/**
 * Menu actions titre (style Deezer) — sheet bas d’écran.
 * Options injectées par l’écran (favoris / playlist / …).
 */
export function TrackActionsSheet({
  visible,
  title,
  subtitle,
  actions,
  onClose,
}: TrackActionsSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 justify-end bg-black/55"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fermer le menu"
      >
        <Pressable
          onPress={() => undefined}
          accessibilityViewIsModal
          className="rounded-t-3xl border-t border-himba-ochre/40 bg-himba-earth px-5 pb-10 pt-4"
        >
          <View className="mb-4 items-center">
            <View className="mb-3 h-1 w-10 rounded-full bg-himba-mist/50" />
            {title ? (
              <Text
                className="text-center text-base font-semibold text-himba-ink"
                numberOfLines={1}
              >
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text
                className="mt-0.5 text-center text-sm text-himba-mist"
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View className="gap-1">
            {actions.map((action) => (
              <Pressable
                key={action.key}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                className="min-h-[48px] justify-center rounded-2xl px-3 py-3 active:bg-himba-night/40"
              >
                <Text
                  className={`text-base font-medium ${
                    action.destructive
                      ? 'text-himba-alert'
                      : 'text-himba-ink'
                  }`}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Annuler"
            className="mt-3 min-h-[48px] items-center justify-center rounded-2xl border border-himba-ochre/50 py-3"
          >
            <Text className="text-base font-semibold text-himba-mist">
              Annuler
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
