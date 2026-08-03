import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { loginFormSchema, type LoginFormValues } from '@/schemas/auth';
import { useLoginMutation } from '@/store/api/authApi';

function firstParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return '';
}

export default function LoginScreen() {
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const prefillsEmail = useMemo(() => firstParam(params.email), [params.email]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { login: prefillsEmail, password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values).unwrap();
    } catch (error) {
      setFormError(getErrorMessage(error, 'Connexion impossible'));
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
              Bienvenue
            </Text>
            <Text className="mb-8 text-center text-base text-himba-mist">
              {prefillsEmail
                ? 'Après validation de ton email, connecte-toi pour entrer dans Himba.'
                : 'Connecte-toi pour découvrir les sons qui voyagent.'}
            </Text>

            <View className="gap-4 rounded-3xl border border-himba-canopy/60 bg-himba-night/70 p-4">
              <Controller
                control={control}
                name="login"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email ou pseudo"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="username"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={errors.login?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Mot de passe"
                    isPassword
                    textContentType="password"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={errors.password?.message}
                  />
                )}
              />

              {formError ? (
                <Text className="text-center text-sm text-himba-alert">
                  {formError}
                </Text>
              ) : null}

              <Button
                label="Se connecter"
                loading={isLoading}
                onPress={onSubmit}
              />
            </View>

            <View className="mt-8 flex-row items-center justify-center gap-1">
              <Text className="text-himba-mist">Pas encore de compte ?</Text>
              <Link href="/(auth)/register">
                <Text className="font-semibold text-himba-ember">
                  S&apos;inscrire
                </Text>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
