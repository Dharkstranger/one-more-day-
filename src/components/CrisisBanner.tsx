import { Linking, Pressable, Text, View } from 'react-native';
import { CRISIS_RESOURCES } from '../config/crisisResources';

export function CrisisBanner() {
  return (
    <View className="mb-4 rounded-2xl bg-rose-50 p-4">
      <Text className="text-base font-semibold text-rose-900">You matter. Please reach someone now.</Text>
      {CRISIS_RESOURCES.map((r) => (
        <Pressable key={r.url} onPress={() => Linking.openURL(r.url)} className="mt-2">
          <Text className="text-rose-800 underline">
            {r.action}: {r.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
