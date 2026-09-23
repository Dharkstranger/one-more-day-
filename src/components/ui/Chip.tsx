import { Pressable, Text } from 'react-native';
import { tap } from '../../services/haptics';

export function Chip({ label, selected, onPress, dark = false }: { label: string; selected: boolean; onPress: () => void; dark?: boolean }) {
  const idle = dark ? 'bg-white/10 border-white/25' : 'bg-white border-ink/10';
  const idleText = dark ? 'text-white' : 'text-ink';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      className={`mb-2 mr-2 rounded-full border px-4 py-2 ${selected ? 'border-amber bg-sun' : idle}`}
    >
      <Text className={`font-body-bold ${selected ? 'text-ink' : idleText}`}>{label}</Text>
    </Pressable>
  );
}
