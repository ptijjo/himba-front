import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { himbaColors } from '@/constants/theme';
import { getErrorMessage } from '@/lib/errors/apiError';
import {
  REPORT_REASON_OPTIONS,
  type ReportReason,
  type ReportTargetType,
} from '@/schemas/reports';
import { useCreateReportMutation } from '@/store/api/reportsApi';

type ReportModalProps = {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  /** Titre affiché (nom artiste / titre / pseudo). */
  targetLabel?: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

/**
 * Formulaire signalement — motif + détails optionnels → POST /reports.
 */
export function ReportModal({
  visible,
  targetType,
  targetId,
  targetLabel,
  onClose,
  onSubmitted,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [createReport, { isLoading }] = useCreateReportMutation();

  const resetAndClose = () => {
    setReason(null);
    setDetails('');
    setError(null);
    setDone(false);
    onClose();
  };

  const onSubmit = async () => {
    if (!reason) {
      setError('Choisis un motif');
      return;
    }
    setError(null);
    try {
      await createReport({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      }).unwrap();
      setDone(true);
      onSubmitted?.();
    } catch (e) {
      setError(getErrorMessage(e, 'Signalement impossible'));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={resetAndClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 justify-end bg-black/55"
        onPress={resetAndClose}
        accessibilityRole="button"
        accessibilityLabel="Fermer"
      >
        <Pressable
          onPress={() => undefined}
          accessibilityViewIsModal
          className="max-h-[85%] rounded-t-3xl border-t border-himba-ochre/40 bg-himba-earth px-5 pb-10 pt-4"
        >
          <View className="mb-3 items-center">
            <View className="mb-3 h-1 w-10 rounded-full bg-himba-mist/50" />
            <Text className="text-lg font-bold text-himba-ink">Signaler</Text>
            {targetLabel ? (
              <Text
                className="mt-1 text-center text-sm text-himba-mist"
                numberOfLines={2}
              >
                {targetLabel}
              </Text>
            ) : null}
          </View>

          {done ? (
            <View className="gap-4 py-4">
              <Text className="text-center text-base text-himba-ink">
                Merci. On va examiner ce signalement.
              </Text>
              <Pressable
                onPress={resetAndClose}
                accessibilityRole="button"
                className="min-h-[48px] items-center justify-center rounded-2xl bg-himba-ember"
              >
                <Text className="font-semibold text-himba-ink">Fermer</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text className="mb-2 text-sm font-semibold text-himba-mist">
                Motif
              </Text>
              <View className="gap-1">
                {REPORT_REASON_OPTIONS.map((opt) => {
                  const selected = reason === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setReason(opt.value)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      className={`min-h-[48px] justify-center rounded-2xl px-3 py-3 ${
                        selected
                          ? 'border border-himba-ember bg-himba-night/50'
                          : 'bg-himba-night/30'
                      }`}
                    >
                      <Text
                        className={`text-base ${
                          selected
                            ? 'font-semibold text-himba-ink'
                            : 'text-himba-mist'
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text className="mb-2 mt-4 text-sm font-semibold text-himba-mist">
                Précisions (optionnel)
              </Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Décris brièvement le problème…"
                placeholderTextColor={himbaColors.mist}
                multiline
                maxLength={500}
                className="min-h-[88px] rounded-2xl bg-himba-night/40 px-3 py-3 text-base text-himba-ink"
                textAlignVertical="top"
                accessibilityLabel="Précisions du signalement"
              />

              {error ? (
                <Text className="mt-3 text-sm text-himba-alert">{error}</Text>
              ) : null}

              <Pressable
                onPress={() => {
                  void onSubmit();
                }}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Envoyer le signalement"
                className="mt-4 min-h-[48px] items-center justify-center rounded-2xl bg-himba-ember"
              >
                {isLoading ? (
                  <ActivityIndicator color={himbaColors.ink} />
                ) : (
                  <Text className="font-semibold text-himba-ink">Envoyer</Text>
                )}
              </Pressable>

              <Pressable
                onPress={resetAndClose}
                accessibilityRole="button"
                className="mt-3 min-h-[48px] items-center justify-center"
              >
                <Text className="font-semibold text-himba-mist">Annuler</Text>
              </Pressable>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
