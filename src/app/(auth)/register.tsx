import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
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
import { registerFormSchema, type RegisterFormValues } from '@/schemas/auth';
import {
  useRegisterMutation,
  useResendVerificationMutation,
} from '@/store/api/authApi';

export default function RegisterScreen() {
  const [register, { isLoading }] = useRegisterMutation();
  const [resend, { isLoading: resending }] = useResendVerificationMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { username: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setInfo(null);
    try {
      // Plus de tokens à l’inscription — validation email obligatoire (48 h).
      const result = await register(values).unwrap();
      setPendingEmail(result.email);
      setInfo(result.message);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Inscription impossible'));
    }
  });

  const onResend = async () => {
    const email = pendingEmail ?? getValues('email');
    if (!email) {
      return;
    }
    setFormError(null);
    try {
      const result = await resend({ email }).unwrap();
      setInfo(result.message);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Envoi impossible'));
    }
  };

  // Après validation dans le navigateur : connexion manuelle (pas d’auto-login).
  const goLoginAfterVerify = () => {
    router.push({
      pathname: '/(auth)/login',
      params: pendingEmail ? { email: pendingEmail } : undefined,
    });
  };

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
              Créer un compte
            </Text>
            <Text className="mb-8 text-center text-base text-himba-mist">
              Rejoins Himba gratuitement — auditeur ou artiste.
            </Text>

            {pendingEmail ? (
              <View className="gap-4 rounded-3xl border border-himba-canopy/60 bg-himba-night/70 p-4">
                <Text className="text-center text-lg font-semibold text-himba-ink">
                  Vérifie ta boîte mail
                </Text>
                <Text className="text-center text-sm text-himba-mist">
                  Un lien a été envoyé à{' '}
                  <Text className="font-semibold text-himba-saffron">
                    {pendingEmail}
                  </Text>
                  {' '}
                  (valable 48 h).
                </Text>

                <View className="gap-2 rounded-2xl bg-himba-earth/80 px-3 py-3">
                  <Text className="text-sm font-semibold text-himba-ink">
                    Étapes
                  </Text>
                  <Text className="text-sm text-himba-mist">
                    1. Ouvre l’email Himba (pense aux spams)
                  </Text>
                  <Text className="text-sm text-himba-mist">
                    2. Clique sur « Valider mon email »
                  </Text>
                  <Text className="text-sm text-himba-mist">
                    3. Reviens ici et connecte-toi (pas de connexion auto)
                  </Text>
                </View>

                {info ? (
                  <Text className="text-center text-sm text-himba-ember">
                    {info}
                  </Text>
                ) : null}
                {formError ? (
                  <Text className="text-center text-sm text-himba-alert">
                    {formError}
                  </Text>
                ) : null}

                <Button
                  label="J’ai validé — me connecter"
                  onPress={goLoginAfterVerify}
                />
                <Button
                  label="Renvoyer l’email"
                  variant="secondary"
                  loading={resending}
                  onPress={() => {
                    void onResend();
                  }}
                />
              </View>
            ) : (
              <View className="gap-4 rounded-3xl border border-himba-canopy/60 bg-himba-night/70 p-4">
                <Controller
                  control={control}
                  name="username"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Pseudo"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={errors.username?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Email"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={errors.email?.message}
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
                      textContentType="newPassword"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={errors.password?.message}
                    />
                  )}
                />
                <Text className="text-xs text-himba-mist">
                  Mot de passe : 8 caractères min., majuscule, minuscule, chiffre
                  et symbole.
                </Text>

                {formError ? (
                  <Text className="text-center text-sm text-himba-alert">
                    {formError}
                  </Text>
                ) : null}

                <Button
                  label="S'inscrire"
                  loading={isLoading}
                  onPress={onSubmit}
                />
              </View>
            )}

            <View className="mt-8 flex-row items-center justify-center gap-1">
              <Text className="text-himba-mist">Déjà un compte ?</Text>
              <Link href="/(auth)/login">
                <Text className="font-semibold text-himba-ember">
                  Se connecter
                </Text>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
