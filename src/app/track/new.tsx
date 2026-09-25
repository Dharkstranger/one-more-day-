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
import { copy } from '../../copy/en';
import { Appear } from '../../components/motion/Appear';
import { useCelebrate } from '../../components/motion/Celebration';

const c = copy.newTracker;

const INTERVALS = [7, 14, 30, 60, 90];
const CATEGORIES: AddictionCategory[] = ['substance', 'behavioral', 'digital'];

export default function NewTracker() {
  const db = useSQLiteContext();
  const celebrate = useCelebrate();
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
    celebrate(first ? 20 : 0);
  };

  return (
    <Screen level={2}>
      {!first ? (
        <Text onPress={() => router.back()} className="mb-2 font-body-bold text-white/80">
          {c.back}
        </Text>
      ) : null}
      <Title light>{c.title}</Title>
      <Body light className="mb-5 mt-2">
        {c.subtitle}
      </Body>

      <Appear index={1}>
      <Card>
        <View className="flex-row flex-wrap">
          {PRESETS.map((p) => (
            <Chip key={p.id} label={`${p.emoji} ${p.name}`} selected={preset?.id === p.id} onPress={() => pick(p)} />
          ))}
        </View>
        <Field
          label={c.customLabel}
          value={name}
          onChangeText={(v) => {
            setName(v);
            setPreset(null);
          }}
          placeholder={c.customPlaceholder}
          maxLength={40}
        />
        {!preset ? (
          <>
            <Label className="mb-2">{c.symbol}</Label>
            <View className="mb-3 flex-row flex-wrap">
              {CUSTOM_EMOJIS.map((e) => (
                <Chip key={e} label={e} selected={emoji === e} onPress={() => setEmoji(e)} />
              ))}
            </View>
            <Label className="mb-2">{c.kind}</Label>
            <View className="flex-row flex-wrap">
              {CATEGORIES.map((k) => (
                <Chip key={k} label={c.kinds[k]} selected={category === k} onPress={() => setCategory(k)} />
              ))}
            </View>
          </>
        ) : null}
      </Card>
      </Appear>

      <Appear index={2}>
      <Card>
        <Heading>{c.goalTitle}</Heading>
        <View className="mt-3 flex-row flex-wrap">
          <Chip label={c.goalQuit} selected={mode === 'quit'} onPress={() => setMode('quit')} />
          <Chip label={c.goalObserve} selected={mode === 'observe'} onPress={() => setMode('observe')} />
        </View>
        <Body className="mt-1 text-sm">
          {mode === 'observe'
            ? c.goalObserveBody
            : c.goalQuitBody}
        </Body>

        {mode === 'quit' ? (
          <>
            <Label className="mb-2 mt-5">{c.intervalLabel}</Label>
            <View className="flex-row flex-wrap">
              {INTERVALS.map((d) => (
                <Chip key={d} label={`${d} days`} selected={interval === d} onPress={() => setInterval(d)} />
              ))}
            </View>
            <Body className="text-sm">
              {c.intervalBody}
              {category === 'substance' ? c.toleranceNote : ''}
            </Body>
          </>
        ) : null}
      </Card>
      </Appear>

      <Appear index={3}>
      <Card>
        <Heading>{c.costTitle}</Heading>
        <Body className="mb-4 mt-1 text-sm">{c.costBody}</Body>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field label={c.money} value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder={preset?.costHint ?? '0'} maxLength={8} />
          </View>
          <View className="flex-1">
            <Field label={c.hours} value={hours} onChangeText={setHours} keyboardType="decimal-pad" placeholder="0" maxLength={5} />
          </View>
        </View>
      </Card>
      </Appear>

      <Appear index={4}>
      <Card>
        <Heading>{c.whyTitle}</Heading>
        <Body className="mb-4 mt-1 text-sm">{c.whyBody}</Body>
        {reasons.map((r, i) => (
          <Field
            key={i}
            label={c.reason(i)}
            value={r}
            onChangeText={(v) => setReasons(reasons.map((x, j) => (j === i ? v : x)))}
            placeholder={c.reasonHints[i]}
            maxLength={120}
          />
        ))}
      </Card>
      </Appear>

      <Button label={mode === 'observe' ? c.startObserve : c.startQuit} onPress={save} disabled={!name.trim() || saving} />
      <Text className="mt-4 text-center font-body text-sm text-white/70">{c.privacy}</Text>
    </Screen>
  );
}
