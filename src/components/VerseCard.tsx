import { Text, View } from 'react-native';
import { Label } from './ui/Text';

export function VerseCard({ text, reference, title = 'Word for today', chapter, rtl }: { text: string; reference: string; title?: string; chapter?: string | null; rtl?: boolean }) {
  return (
    <View className="mb-4 rounded-[28px] bg-night/35 p-5">
      <Label light>{title}</Label>
      <Text
        className="mt-3 font-display text-lg leading-7 text-white"
        style={rtl ? { writingDirection: 'rtl', textAlign: 'right', fontFamily: undefined, fontSize: 21 } : undefined}
      >
        “{text.replace(/^[“"«]|[”"»]$/g, '')}”
      </Text>
      <Text className="mt-2 font-body-bold text-sm text-sun">{reference}</Text>
      {chapter ? <Text className="mt-3 font-body text-sm text-white/80">Read and pray through {chapter} today.</Text> : null}
    </View>
  );
}
