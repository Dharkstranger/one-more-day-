import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CrisisBanner } from '../components/CrisisBanner';
import { TrackerPicker } from '../components/TrackerPicker';
import { VerseCard } from '../components/VerseCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Screen } from '../components/ui/Screen';
import { Body, Heading, Label, Title } from '../components/ui/Text';
import { findScripturesByTags, scriptureRef } from '../db/repo/scriptures';
import { getDetails } from '../db/repo/details';
import { listLogs } from '../db/repo/logs';
import { totalRays } from '../db/repo/rays';
import type { ScriptureRow } from '../db/types';
import { useTrackers } from '../hooks/useTrackers';
import { recordLog } from '../services/actions';
import { tagsFor, TRIGGER_EMOTIONS } from '../services/ai/scriptureTags';
import { detectCrisis } from '../services/ai/crisis';
import { levelFor, trackerStats } from '../services/sunshine/engine';

const WHEN = [
  { id: 'now', label: 'Just now', hoursAgo: 0 },
  { id: 'earlier', label: 'Earlier today', hoursAgo: 4 },
  { id: 'yesterday', label: 'Yesterday', hoursAgo: 24 },
] as const;

interface Result {
  logId: string;
  rays: number;
  total: number;
  levelName: string;
  best: number;
  observe: boolean;
  verse: ScriptureRow | null;
}

export default function Slip() {
  const db = useSQLiteContext();
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
    const [total, logs, details, verses] = await Promise.all([
      totalRays(db),
      listLogs(db, id, 2000),
      getDetails(db, id),
      findScripturesByTags(db, tagsFor({ text: note, emotion, slipped: true }), 1),
    ]);
    const stats = trackerStats({ createdAt: tracker.addiction.created_at, weeklyCost: 0, weeklyHours: 0 }, logs);
    setResult({
      logId,
      rays: raysEarned,
      total,
      levelName: levelFor(total).level.name,
      best: stats.longestStreakDays,
      observe: details?.mode === 'observe',
      verse: verses[0] ?? null,
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
            {result.observe ? 'Logged. Thank you.' : 'Thank you for being honest.'}
          </Title>
          <Body light className="mt-3 text-center text-lg">
            {result.observe
              ? 'Every log makes your pattern clearer. No judgement here.'
              : 'A slip doesn’t erase the days you fought for. Today is day 0, and day 0 is still a day in the fight.'}
          </Body>
        </View>

        <Card className="mt-6">
          <Label>What you still have</Label>
          <Text className="mt-2 font-body-bold text-lg text-ink">✨ {result.total} rays · {result.levelName}</Text>
          {!result.observe && result.best > 0 ? (
            <Text className="mt-1 font-body text-ink/80">Your best run is {result.best} days. You’ve done it before. You can do it again.</Text>
          ) : null}
          <Text className="mt-1 font-body text-ink/80">+{result.rays} rays for telling the truth.</Text>
        </Card>

        {result.verse ? <VerseCard title="For right now" text={result.verse.text} reference={scriptureRef(result.verse)} chapter="Psalm 51" /> : null}
        {detectCrisis(note) ? <CrisisBanner /> : null}

        <Button label="Talk about what happened" icon="💬" onPress={() => router.replace(`/sponsor?mode=slip&id=${id}&log=${result.logId}`)} className="mb-3" />
        <Button label="Back to today" variant="ghost" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen level={1}>
      <Text onPress={() => router.back()} className="mb-2 font-body-bold text-white/80">
        ‹ Back
      </Text>
      <Title light>{observe ? 'Log it' : 'It happened. That’s okay.'}</Title>
      <Body light className="mb-5 mt-2">
        {observe ? 'Just the facts. It helps you see the pattern.' : 'You’re here, being honest. That already takes courage.'}
      </Body>

      {trackers.length > 1 && !params.id ? (
        <View className="mb-4">
          <Label light className="mb-2">
            Which one?
          </Label>
          <TrackerPicker trackers={trackers} value={id} onChange={setId} />
        </View>
      ) : null}

      <Card>
        <Heading className="mb-2">When?</Heading>
        <View className="mb-3 flex-row flex-wrap">
          {WHEN.map((w) => (
            <Chip key={w.id} label={w.label} selected={when === w.id} onPress={() => setWhen(w.id)} />
          ))}
        </View>
        <Heading className="mb-2">What were you feeling?</Heading>
        <View className="mb-3 flex-row flex-wrap">
          {TRIGGER_EMOTIONS.map((e) => (
            <Chip key={e} label={e} selected={emotion === e} onPress={() => setEmotion(emotion === e ? null : e)} />
          ))}
        </View>
        <Field label="What happened? (optional, only you see this)" value={note} onChangeText={setNote} multiline />
      </Card>

      <Button label="Log it" onPress={save} disabled={!id} />
    </Screen>
  );
}
