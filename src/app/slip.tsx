import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CrisisBanner } from '../components/CrisisBanner';
import { TrackerPicker } from '../components/TrackerPicker';
import { ScriptureGuideCard } from '../components/ScriptureGuideCard';
import { Appear } from '../components/motion/Appear';
import { useCelebrate } from '../components/motion/Celebration';
import { copy } from '../copy/en';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Screen } from '../components/ui/Screen';
import { Body, Heading, Label, Title } from '../components/ui/Text';
import { getDetails } from '../db/repo/details';
import { listLogs } from '../db/repo/logs';
import { totalRays } from '../db/repo/rays';
import { useTrackers } from '../hooks/useTrackers';
import { recordLog } from '../services/actions';
import { TRIGGER_EMOTIONS } from '../services/ai/scriptureTags';
import { detectCrisis } from '../services/ai/crisis';
import { levelFor, trackerStats } from '../services/sunshine/engine';

const c = copy.slip;
const WHEN = [
  { id: 'now', label: c.whenOptions.now, hoursAgo: 0 },
  { id: 'earlier', label: c.whenOptions.earlier, hoursAgo: 4 },
  { id: 'yesterday', label: c.whenOptions.yesterday, hoursAgo: 24 },
] as const;

interface Result {
  logId: string;
  rays: number;
  total: number;
  levelName: string;
  best: number;
  observe: boolean;
  emotion: string | null;
  note: string;
}

export default function Slip() {
  const db = useSQLiteContext();
  const celebrate = useCelebrate();
  const params = useLocalSearchParams<{ id?: string; from?: string }>();
  const trackers = useTrackers();
  const [id, setId] = useState<string | null>(params.id ?? null);
  const [when, setWhen] = useState<(typeof WHEN)[number]['id']>('now');
  const [emotion, setEmotion] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!id && trackers.length === 1) setId(trackers[0].addiction.id);
  }, [id, trackers]);

  const tracker = trackers.find((t) => t.addiction.id === id);
  const observe = tracker?.details?.mode === 'observe';

  const save = async () => {
    if (!id || !tracker) return;
    const hoursAgo = WHEN.find((w) => w.id === when)?.hoursAgo ?? 0;
    const at = new Date(Date.now() - hoursAgo * 3600_000);
    const { logId, raysEarned } = await recordLog(db, {
      addictionId: id,
      logType: params.from === 'urge' ? 'urging_failed' : 'slip',
      at,
      triggerEmotion: emotion ?? undefined,
      userNote: note.trim() || undefined,
    });
    celebrate(raysEarned);
    const [total, logs, details] = await Promise.all([totalRays(db), listLogs(db, id, 2000), getDetails(db, id)]);
    const stats = trackerStats({ createdAt: tracker.addiction.created_at, weeklyCost: 0, weeklyHours: 0 }, logs);
    setResult({
      logId,
      rays: raysEarned,
      total,
      levelName: levelFor(total).level.name,
      best: stats.longestStreakDays,
      observe: details?.mode === 'observe',
      emotion,
      note: note.trim(),
    });
  };

  if (result) {
    return (
      <Screen level={2}>
        <View className="mt-8 items-center">
          <Text className="text-6xl">
            🌧️ <Text className="text-white">→</Text> 🌤️
          </Text>
          <Title light className="mt-4 text-center">
            {result.observe ? c.doneTitleObserve : c.doneTitle}
          </Title>
          <Body light className="mt-3 text-center text-lg">
            {result.observe ? c.doneBodyObserve : c.doneBody}
          </Body>
        </View>

        <Appear index={1}>
        <Card className="mt-6">
          <Label>{c.stillHave}</Label>
          <Text className="mt-2 font-body-bold text-lg text-ink">✨ {result.total} rays · {result.levelName}</Text>
          {!result.observe && result.best > 0 ? (
            <Text className="mt-1 font-body text-ink/80">{c.bestRun(result.best)}</Text>
          ) : null}
          <Text className="mt-1 font-body text-ink/80">{c.honesty(result.rays)}</Text>
        </Card>
        </Appear>

        {detectCrisis(result.note) ? <CrisisBanner /> : null}
        <Appear index={2}>
          <ScriptureGuideCard input={{ moment: 'slip', addictionId: id, emotion: result.emotion, note: result.note }} />
        </Appear>

        <Button label={c.talk} icon="💬" onPress={() => router.replace(`/sponsor?mode=slip&id=${id}&log=${result.logId}`)} className="mb-3" />
        <Button label={c.home} variant="ghost" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen level={1}>
      <Text onPress={() => router.back()} className="mb-2 font-body-bold text-white/80">
        {c.back}
      </Text>
      <Title light>{observe ? c.titleObserve : c.title}</Title>
      <Body light className="mb-5 mt-2">
        {observe ? c.bodyObserve : c.body}
      </Body>

      {trackers.length > 1 && !params.id ? (
        <View className="mb-4">
          <Label light className="mb-2">
            {c.which}
          </Label>
          <TrackerPicker trackers={trackers} value={id} onChange={setId} />
        </View>
      ) : null}

      <Card>
        <Heading className="mb-2">{c.when}</Heading>
        <View className="mb-3 flex-row flex-wrap">
          {WHEN.map((w) => (
            <Chip key={w.id} label={w.label} selected={when === w.id} onPress={() => setWhen(w.id)} />
          ))}
        </View>
        <Heading className="mb-2">{c.feeling}</Heading>
        <View className="mb-3 flex-row flex-wrap">
          {TRIGGER_EMOTIONS.map((e) => (
            <Chip key={e} label={e} selected={emotion === e} onPress={() => setEmotion(emotion === e ? null : e)} />
          ))}
        </View>
        <Field label={c.note} value={note} onChangeText={setNote} multiline />
      </Card>

      <Button label={c.submit} onPress={save} disabled={!id} />
    </Screen>
  );
}
