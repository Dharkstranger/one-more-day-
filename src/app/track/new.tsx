import { useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { Field } from '../../components/ui/Field';
import { Screen } from '../../components/ui/Screen';
import { Body, Heading, Label, Title } from '../../components/ui/Text';
import { CUSTOM_EMOJIS, PRESETS, type AddictionPreset } from '../../config/presets';
import type { AddictionCategory, TrackingMode } from '../../db/types';
import { startTracking } from '../../services/actions';
import { success } from '../../services/haptics';

const INTERVALS = [7, 14, 30, 60, 90];
const CATEGORIES: { id: AddictionCategory; label: string }[] = [
  { id: 'substance', label: 'Something I take' },
  { id: 'behavioral', label: 'Something I do' },
  { id: 'digital', label: 'Something on a screen' },
];

export default function NewTracker() {
  const db = useSQLiteContext();
  const { first } = useLocalSearchParams<{ first?: string }>();
  const [preset, setPreset] = useState<AddictionPreset | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [category, setCategory] = useState<AddictionCategory>('behavioral');
  const [mode, setMode] = useState<TrackingMode>('quit');
  const [interval, setInterval] = useState(30);
  const [cost, setCost] = useState('');
  const [hours, setHours] = useState('');
  const [reasons, setReasons] = useState(['', '', '']);
  const [saving, setSaving] = useState(false);

  const pick = (p: AddictionPreset) => {
    setPreset(p);
    setName(p.name);
    setEmoji(p.emoji);
    setCategory(p.category);
    setInterval(p.intervalDays);
  };

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await startTracking(db, {
      name: name.trim(),
      category,
      intervalDays: interval,
      emoji,
      mode,
      weeklyCost: parseFloat(cost) || 0,
      weeklyHours: parseFloat(hours) || 0,
      reasons: reasons.map((r) => r.trim()).filter(Boolean),
    });
    success();
    router.replace('/');
  };

  return (
    <Screen level={2}>
      {!first ? (
        <Text onPress={() => router.back()} className="mb-2 font-body-bold text-white/80">
          ‹ Back
        </Text>
      ) : null}
      <Title light>What are you fighting?</Title>
      <Body light className="mb-5 mt-2">
        Pick one or type your own. Anything counts. You can add more later.
      </Body>

      <Card>
        <View className="flex-row flex-wrap">
          {PRESETS.map((p) => (
            <Chip key={p.id} label={`${p.emoji} ${p.name}`} selected={preset?.id === p.id} onPress={() => pick(p)} />
          ))}
        </View>
        <Field
          label="Or name it yourself"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setPreset(null);
          }}
          placeholder="e.g. energy drinks, online arguments…"
          maxLength={40}
        />
        {!preset ? (
          <>
            <Label className="mb-2">Pick a symbol</Label>
            <View className="mb-3 flex-row flex-wrap">
              {CUSTOM_EMOJIS.map((e) => (
                <Chip key={e} label={e} selected={emoji === e} onPress={() => setEmoji(e)} />
              ))}
            </View>
            <Label className="mb-2">What kind is it?</Label>
            <View className="flex-row flex-wrap">
              {CATEGORIES.map((c) => (
                <Chip key={c.id} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
              ))}
            </View>
          </>
        ) : null}
      </Card>

      <Card>
        <Heading>What do you want to do?</Heading>
        <View className="mt-3 flex-row flex-wrap">
          <Chip label="Stop completely" selected={mode === 'quit'} onPress={() => setMode('quit')} />
          <Chip label="Just see how often" selected={mode === 'observe'} onPress={() => setMode('observe')} />
        </View>
        <Body className="mt-1 text-sm">
          {mode === 'observe'
            ? 'No streaks, no pressure. Log it when it happens and we’ll show you the pattern. You can switch to stopping any time.'
            : 'We’ll count every day you stay free and celebrate each milestone.'}
        </Body>

        {mode === 'quit' ? (
          <>
            <Label className="mb-2 mt-5">Big milestone every</Label>
            <View className="flex-row flex-wrap">
              {INTERVALS.map((d) => (
                <Chip key={d} label={`${d} days`} selected={interval === d} onPress={() => setInterval(d)} />
              ))}
            </View>
            <Body className="text-sm">
              Each big milestone banks 24 hours of “break time”. Most people find they never want to spend it. That’s the point.
              {category === 'substance'
                ? ' If you ever do: your tolerance will be lower than before, and the old amount can be dangerous.'
                : ''}
            </Body>
          </>
        ) : null}
      </Card>

      <Card>
        <Heading>What does it cost you?</Heading>
        <Body className="mb-4 mt-1 text-sm">Optional. We’ll show what you win back.</Body>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label="Money / week" value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder={preset?.costHint ?? '0'} maxLength={8} />
          </View>
          <View className="flex-1">
            <Field label="Hours / week" value={hours} onChangeText={setHours} keyboardType="decimal-pad" placeholder="0" maxLength={5} />
          </View>
        </View>
      </Card>

      <Card>
        <Heading>Why do you want this?</Heading>
        <Body className="mb-4 mt-1 text-sm">Optional. We’ll remind you of these when it gets hard.</Body>
        {reasons.map((r, i) => (
          <Field
            key={i}
            label={`Reason ${i + 1}`}
            value={r}
            onChangeText={(v) => setReasons(reasons.map((x, j) => (j === i ? v : x)))}
            placeholder={['For my kids', 'To feel clear in the mornings', 'To trust myself again'][i]}
            maxLength={120}
          />
        ))}
      </Card>

      <Button label={mode === 'observe' ? 'Start watching' : 'Start counting'} onPress={save} disabled={!name.trim() || saving} />
      <Text className="mt-4 text-center font-body text-sm text-white/70">Stays on this device. Nothing is uploaded.</Text>
    </Screen>
  );
}
