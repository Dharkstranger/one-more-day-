import { Linking, Pressable, Text, View } from 'react-native';
import { CRISIS_RESOURCES } from '../config/crisisResources';

export function CrisisBanner({ compact = false }: { compact?: boolean }) {
  return (
    <View className="mb-4 rounded-[24px] bg-rose/95 p-4">
      <Text className="font-body-black text-base text-ink">
        {compact ? 'In danger right now?' : 'You matter. Please reach a person right now.'}
      </Text>
      {CRISIS_RESOURCES.map((r) => (
        <Pressable key={r.url} accessibilityRole="link" onPress={() => Linking.openURL(r.url)} className="mt-2">
          <Text className="font-body-bold text-ink underline">
            {r.action} · <Text className="font-body">{r.label}</Text>
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
