import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type ProfileAccordionProps = {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

/**
 * Section profil repliable — un formulaire visible à la fois.
 */
export function ProfileAccordion({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: ProfileAccordionProps) {
  return (
    <View className="overflow-hidden rounded-2xl bg-himba-earth">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}${open ? ', ouvert' : ', fermé'}`}
        className="min-h-[52px] flex-row items-center gap-3 px-4 py-3"
      >
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-bold text-himba-ink">{title}</Text>
          {subtitle && !open ? (
            <Text className="text-sm text-himba-mist" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Text className="text-lg text-himba-ember">{open ? '▾' : '▸'}</Text>
      </Pressable>
      {open ? <View className="gap-3 border-t border-himba-ochre/25 px-4 pb-4 pt-3">{children}</View> : null}
    </View>
  );
}
