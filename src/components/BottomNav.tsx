import { Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tap } from '../services/haptics';
import { copy } from '../copy/en';
import { PressScale } from './motion/PressScale';

const ITEMS = [
  { href: '/', icon: '☀️', label: copy.nav.today },
  { href: '/journey', icon: '🌄', label: copy.nav.journey },
  { href: '/sponsor', icon: '💬', label: copy.nav.talk },
  { href: '/settings', icon: '⚙️', label: copy.nav.settings },
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
            <PressScale
              depth={0.9}
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
            </PressScale>
          );
        })}
      </View>
    </View>
  );
}
