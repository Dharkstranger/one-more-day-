import { Pressable, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tap } from '../services/haptics';

const ITEMS = [
  { href: '/', icon: '☀️', label: 'Today' },
  { href: '/journey', icon: '🌄', label: 'Journey' },
  { href: '/sponsor', icon: '💬', label: 'Talk' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
] as const;

export function BottomNav() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View
      className="absolute bottom-0 left-0 right-0 items-center"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      pointerEvents="box-none"
    >
      <View className="w-[92%] max-w-[440px] flex-row justify-around rounded-full bg-night/90 px-2 py-2">
        {ITEMS.map((item) => {
          const active = path === item.href;
          return (
            <Pressable
              key={item.href}
              accessibilityRole="link"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              onPress={() => {
                tap();
                if (!active) router.replace(item.href);
              }}
              className={`items-center rounded-full px-4 py-2 ${active ? 'bg-white/15' : ''}`}
            >
              <Text className="text-lg">{item.icon}</Text>
              <Text className={`font-body-bold text-[11px] ${active ? 'text-sun' : 'text-white/70'}`}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
