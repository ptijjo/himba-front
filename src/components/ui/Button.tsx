import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-himba-ember',
  secondary: 'border border-himba-copper bg-transparent',
  ghost: 'bg-himba-earth',
};

export function Button({
  label,
  loading = false,
  variant = 'primary',
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      className={`min-h-[52px] items-center justify-center rounded-pill px-6 ${variantClass[variant]} ${isDisabled ? 'opacity-50' : ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="text-base font-semibold text-himba-ink">{label}</Text>
      )}
    </Pressable>
  );
}
