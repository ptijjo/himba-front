import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HimbaWordmark } from '@/components/brand/HimbaWordmark';
import { AtmosphereBackdrop } from '@/components/media/AtmosphereBackdrop';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errors/apiError';
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormValues,
} from '@/schemas/auth';
import { useForgotPasswordMutation } from '@/store/api/authApi';

export default function ForgotPasswordScreen() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setInfo(null);
    try {
      const result = await forgotPassword(values).unwrap();
      setInfo(result.message);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Envoi impossible'));
    }
  });

  return (
    <View className="flex-1 bg-himba-night">
      <AtmosphereBackdrop variant="auth" />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerClassName="flex-grow justify-center px-6 py-10"
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-10 items-center">
              <HimbaWordmark />
            </View>

            <Text
              className="mb-2 text-center text-3xl text-himba-ink"
              style={{ fontFamily: 'Literata_700Bold' }}
            >
              Mot de passe oublié
            </Text>
            <Text className="mb-8 text-center text-base text-himba-mist">
              Entre ton email pour recevoir un lien de réinitialisation.
            </Text>

            <View className="gap-4 rounded-3xl border border-himba-canopy/60 bg-himba-night/70 p-4">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={errors.email?.message}
                  />
                )}
              />

              {formError ? (
                <Text className="text-center text-sm text-himba-alert">
                  {formError}
                </Text>
              ) : null}
              {info ? (
                <Text className="text-center text-sm text-himba-ember">{info}</Text>
              ) : null}

              <Button label="Envoyer le lien" loading={isLoading} onPress={onSubmit} />
            </View>

            <View className="mt-8 items-center">
              <Link href="/(auth)/login">
                <Text className="font-semibold text-himba-ember">
                  Retour à la connexion
                </Text>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

