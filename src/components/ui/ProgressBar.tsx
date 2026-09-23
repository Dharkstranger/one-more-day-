import { View } from 'react-native';

export function ProgressBar({ value, dark = false }: { value: number; dark?: boolean }) {
  const pct = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` as const;
  return (
    <View className={`h-3 w-full overflow-hidden rounded-full ${dark ? 'bg-white/20' : 'bg-ink/10'}`}>
      <View className="h-full rounded-full bg-sun" style={{ width: pct }} />
    </View>
  );
}
