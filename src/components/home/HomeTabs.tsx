import { Pressable, Text, View } from 'react-native';

type HomeTabsProps = {
  active: 'pour-toi' | 'suivis' | 'explorer';
  onChange: (tab: 'pour-toi' | 'suivis' | 'explorer') => void;
};

const TABS = [
  { id: 'pour-toi', label: 'Pour toi' },
  { id: 'suivis', label: 'Suivis' },
  { id: 'explorer', label: 'Explorer' },
] as const;

export function HomeTabs({ active, onChange }: HomeTabsProps) {
  return (
    <View className="flex-row rounded-pill bg-himba-earth p-1">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className={`flex-1 items-center rounded-pill px-3 py-3 ${
              isActive ? 'bg-himba-ember' : ''
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                isActive ? 'text-himba-ink' : 'text-himba-mist'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
