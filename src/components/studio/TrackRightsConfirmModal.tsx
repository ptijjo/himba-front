import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

type TrackRightsConfirmModalProps = {
  visible: boolean;
  loading?: boolean;
  /** Confirmé uniquement si la case est cochée. */
  onConfirm: () => void;
  /** Fermeture sans publication. */
  onCancel: () => void;
};

/**
 * Gate avant POST /tracks : l’artiste atteste être l’auteur
 * ou détenir tous les droits pour mettre le titre en ligne.
 */
export function TrackRightsConfirmModal({
  visible,
  loading = false,
  onConfirm,
  onCancel,
}: TrackRightsConfirmModalProps) {
  const [accepted, setAccepted] = useState(false);

  // Remettre la case à false à chaque ouverture
  useEffect(() => {
    if (visible) {
      setAccepted(false);
    }
  }, [visible]);

  const handleCancel = () => {
    if (loading) {
      return;
    }
    setAccepted(false);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/60 px-5"
        onPress={handleCancel}
        accessibilityRole="button"
        accessibilityLabel="Annuler la publication"
      >
        <Pressable
          onPress={() => undefined}
          accessibilityViewIsModal
          className="w-full max-w-md gap-4 rounded-3xl border border-himba-ochre/40 bg-himba-earth px-5 py-6"
        >
          <Text className="text-lg font-bold text-himba-ink">
            Droits sur cette musique
          </Text>
          <Text className="text-sm leading-5 text-himba-mist">
            Avant de publier, confirme que tu es l’auteur de ce titre ou que tu
            détiens tous les droits nécessaires pour le mettre en ligne sur
            Himba. Publier un contenu sans autorisation peut entraîner son
            retrait et des sanctions sur ton compte.
          </Text>

          <Pressable
            onPress={() => setAccepted((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            accessibilityLabel="Je suis l’auteur ou je détiens tous les droits"
            className="min-h-[48px] flex-row items-start gap-3 rounded-xl py-1"
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
              Oui — je suis l’auteur de cette musique, ou je détiens tous les
              droits pour la publier.
            </Text>
          </Pressable>

          <View className="gap-2 pt-1">
            <Button
              label="Publier le titre"
              loading={loading}
              disabled={!accepted || loading}
              onPress={onConfirm}
            />
            <Button
              label="Annuler"
              variant="secondary"
              disabled={loading}
              onPress={handleCancel}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
