import { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { himbaColors } from '@/constants/theme';

type InputProps = TextInputProps & {
  label: string;
  error?: string;
  /** Active le masquage + bouton afficher/masquer. */
  isPassword?: boolean;
};

export function Input({
  label,
  error,
  isPassword = false,
  secureTextEntry,
  ...rest
}: InputProps) {
  const [visible, setVisible] = useState(false);
  const hideText = isPassword ? !visible : Boolean(secureTextEntry);

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-himba-mist">{label}</Text>
      <View className="relative justify-center">
        <TextInput
          placeholderTextColor={himbaColors.mist}
          className={`min-h-[52px] rounded-pill border px-5 text-base text-himba-ink ${
            isPassword ? 'pr-14' : ''
          } ${
            error ? 'border-himba-alert' : 'border-himba-canopy'
          } bg-himba-earth`}
          accessibilityLabel={label}
          secureTextEntry={hideText}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={
              visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
            }
            hitSlop={8}
            className="absolute right-3 min-h-[44px] min-w-[44px] items-center justify-center"
          >
            {visible ? (
              <EyeOffIcon color={himbaColors.ember} />
            ) : (
              <EyeIcon color={himbaColors.ember} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text
          className="text-sm text-himba-alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function EyeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function EyeOffIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3l18 18"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M9.9 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-3.2 3.9M6.1 6.1C3.7 7.8 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4.2-.9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
