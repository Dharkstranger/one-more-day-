import { View } from 'react-native';
import type { AddictionRow, AddictionDetailsRow } from '../db/types';
import { Chip } from './ui/Chip';

export function TrackerPicker({
  trackers,
  value,
  onChange,
}: {
  trackers: { addiction: AddictionRow; details: AddictionDetailsRow | null }[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap">
      {trackers.map((t) => (
        <Chip
          key={t.addiction.id}
          dark
          label={`${t.details?.emoji ?? '✨'} ${t.addiction.name}`}
          selected={value === t.addiction.id}
          onPress={() => onChange(t.addiction.id)}
        />
      ))}
    </View>
  );
}
