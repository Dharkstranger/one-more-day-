import { Pressable, Text, View } from 'react-native';
import type { AddictionWithProgress } from '../hooks/useAddictions';
import { milestoneMessage } from '../services/recovery/milestones';

interface Props {
  item: AddictionWithProgress;
  onUrgeBeaten: () => void;
  onSlip: () => void;
}

export function StreakCard({ item, onUrgeBeaten, onSlip }: Props) {
  const { addiction, progress } = item;
  const message = milestoneMessage(addiction.name, addiction.category, progress);

  return (
    <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
      <Text className="text-sm uppercase tracking-wide text-slate-500">{addiction.name}</Text>
      <Text className="mt-1 text-5xl font-bold text-slate-900">{progress.streakDays}</Text>
      <Text className="text-slate-500">days free</Text>

      <Text className="mt-4 text-lg font-semibold text-slate-900">{message.title}</Text>
      <Text className="mt-1 text-base text-slate-700">{message.body}</Text>
      {message.safetyNote ? (
        <Text className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{message.safetyNote}</Text>
      ) : null}

      <View className="mt-5 flex-row gap-3">
        <Pressable onPress={onUrgeBeaten} className="flex-1 items-center rounded-xl bg-emerald-600 py-3">
          <Text className="font-semibold text-white">I beat an urge</Text>
        </Pressable>
        <Pressable onPress={onSlip} className="flex-1 items-center rounded-xl bg-slate-200 py-3">
          <Text className="font-semibold text-slate-800">I slipped</Text>
        </Pressable>
      </View>
    </View>
  );
}
