import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Screen } from '../components/ui/Screen';
import { Body, Heading, Title } from '../components/ui/Text';
import { recordCheckin } from '../services/actions';
import { success, tap } from '../services/haptics';
import type { CheckinRow } from '../db/types';
import { SUNSHINE_NOTES } from '../config/copingIdeas';

const MOODS: { v: CheckinRow['mood']; icon: string; label: string }[] = [
  { v: 1, icon: '⛈️', label: 'Stormy' },
  { v: 2, icon: '🌧️', label: 'Rainy' },
  { v: 3, icon: '⛅', label: 'Mixed' },
  { v: 4, icon: '🌤️', label: 'Bright' },
  { v: 5, icon: '☀️', label: 'Sunny' },
];

export default function CheckIn() {
  const db = useSQLiteContext();
  const [mood, setMood] = useState<CheckinRow['mood'] | null>(null);
  const [gratitude, setGratitude] = useState('');
  const [note, setNote] = useState('');
  const [earned, setEarned] = useState<number | null>(null);

  const save = async () => {
    if (!mood) return;
    const rays = await recordCheckin(db, { mood, gratitude: gratitude.trim() || undefined, note: note.trim() || undefined });
    success();
    setEarned(rays);
  };

  if (earned !== null) {
    return (
      <Screen level={4}>
        <View className="mt-16 items-center">
          <Text className="text-7xl">☀️</Text>
          <Title className="mt-4 text-center">{earned > 0 ? `+${earned} rays` : 'Checked in'}</Title>
          <Body className="mt-3 text-center text-lg">{SUNSHINE_NOTES[new Date().getDate() % SUNSHINE_NOTES.length]}</Body>
        </View>
        <Button className="mt-10" label="Back to today" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen level={2}>
      <Text onPress={() => router.back()} className="mb-2 font-body-bold text-white/80">
        ‹ Back
      </Text>
      <Title light>How’s the weather inside?</Title>
      <Body light className="mb-5 mt-2">
        No right answer. Just honest.
      </Body>

      <View className="mb-5 flex-row justify-between">
        {MOODS.map((m) => (
          <Text
            key={m.v}
            accessibilityRole="button"
            accessibilityLabel={m.label}
            onPress={() => {
              tap();
              setMood(m.v);
            }}
            className={`rounded-2xl p-3 text-4xl ${mood === m.v ? 'bg-sun' : 'bg-white/10'}`}
          >
            {m.icon}
          </Text>
        ))}
      </View>

      <Card>
        <Field label="One good thing today (optional)" value={gratitude} onChangeText={setGratitude} placeholder="Even a small one counts" maxLength={200} />
        <Field label="Anything on your mind? (optional)" value={note} onChangeText={setNote} multiline placeholder="Only you will see this." />
        <Heading className="mb-2">Did anything happen today?</Heading>
        <View className="flex-row flex-wrap">
          <Chip label="I slipped" selected={false} onPress={() => router.push('/slip')} />
          <Chip label="I had an urge" selected={false} onPress={() => router.push('/struggle')} />
        </View>
      </Card>

      <Button label="Check in  +10 ✨" onPress={save} disabled={!mood} />
    </Screen>
  );
}
