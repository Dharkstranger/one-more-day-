import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import Animated, { ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { ScriptureGuideCard } from '../components/ScriptureGuideCard';
import { Appear } from '../components/motion/Appear';
import { useCelebrate } from '../components/motion/Celebration';
import { PressScale } from '../components/motion/PressScale';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Screen } from '../components/ui/Screen';
import { Body, Heading, Title } from '../components/ui/Text';
import { copy } from '../copy/en';
import { recordCheckin } from '../services/actions';
import { tap } from '../services/haptics';
import type { CheckinRow } from '../db/types';
import { SUNSHINE_NOTES } from '../config/copingIdeas';

const c = copy.checkin;
const ICONS = ['⛈️', '🌧️', '⛅', '🌤️', '☀️'];

export default function CheckIn() {
  const db = useSQLiteContext();
  const celebrate = useCelebrate();
  const reduce = useReducedMotion();
  const [mood, setMood] = useState<CheckinRow['mood'] | null>(null);
  const [gratitude, setGratitude] = useState('');
  const [note, setNote] = useState('');
  const [earned, setEarned] = useState<number | null>(null);

  const save = async () => {
    if (!mood) return;
    const rays = await recordCheckin(db, { mood, gratitude: gratitude.trim() || undefined, note: note.trim() || undefined });
    celebrate(rays);
    setEarned(rays);
  };

  if (earned !== null && mood) {
    return (
      <Screen level={Math.max(2, mood + 1)}>
        <View className="mt-10 items-center">
          <Animated.Text entering={reduce ? undefined : ZoomIn.springify().damping(10)} style={{ fontSize: 72 }}>
            {ICONS[mood - 1]}
          </Animated.Text>
          <Appear delay={200}>
            <Title light className="mt-4 text-center">
              {c.done(earned)}
            </Title>
            <Body light className="mt-3 text-center text-lg">
              {SUNSHINE_NOTES[new Date().getDate() % SUNSHINE_NOTES.length]}
            </Body>
          </Appear>
        </View>
        <View className="mt-8">
          <ScriptureGuideCard input={{ moment: 'checkin', mood, note: [gratitude, note].filter(Boolean).join('. ') }} />
        </View>
        <Button label={c.back2} onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen level={2}>
      <Text onPress={() => router.back()} className="mb-2 font-body-bold text-white/80">
        {c.back}
      </Text>
      <Appear>
        <Title light>{c.title}</Title>
        <Body light className="mb-5 mt-2">
          {c.subtitle}
        </Body>
      </Appear>

      <Appear index={1}>
        <View className="mb-5 flex-row justify-between">
          {ICONS.map((icon, i) => {
            const v = (i + 1) as CheckinRow['mood'];
            const selected = mood === v;
            return (
              <PressScale
                key={v}
                depth={0.85}
                accessibilityRole="button"
                accessibilityLabel={c.moods[i]}
                accessibilityState={{ selected }}
                onPress={() => {
                  tap();
                  setMood(v);
                }}
                className={`items-center rounded-2xl p-3 ${selected ? 'bg-sun' : 'bg-white/10'}`}
              >
                <Text style={{ fontSize: selected ? 40 : 34 }}>{icon}</Text>
                <Text className={`font-body-bold text-[10px] ${selected ? 'text-ink' : 'text-white/60'}`}>{c.moods[i]}</Text>
              </PressScale>
            );
          })}
        </View>
      </Appear>

      <Appear index={2}>
        <Card>
          <Field label={c.gratitude} value={gratitude} onChangeText={setGratitude} placeholder={c.gratitudeHint} maxLength={200} />
          <Field label={c.note} value={note} onChangeText={setNote} multiline placeholder={c.noteHint} />
          <Heading className="mb-2">{c.anything}</Heading>
          <View className="flex-row flex-wrap">
            <Chip label={c.hadSlip} selected={false} onPress={() => router.push('/slip')} />
            <Chip label={c.hadUrge} selected={false} onPress={() => router.push('/struggle')} />
          </View>
        </Card>
      </Appear>

      <Button label={`${c.submit}  +10 ✨`} onPress={save} disabled={!mood} />
    </Screen>
  );
}
