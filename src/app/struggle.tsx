import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BreathingCircle } from '../components/BreathingCircle';
import { CrisisBanner } from '../components/CrisisBanner';
import { TrackerPicker } from '../components/TrackerPicker';
import { VerseCard } from '../components/VerseCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { Body, Heading, Label, Title } from '../components/ui/Text';
import { COPING_IDEAS, SUNSHINE_NOTES } from '../config/copingIdeas';
import { getDetails, parseReasons } from '../db/repo/details';
import { getProfileValue } from '../db/repo/profile';
import { findScripturesByTags, scriptureRef } from '../db/repo/scriptures';
import type { ScriptureRow } from '../db/types';
import { useTrackers } from '../hooks/useTrackers';
import { recordLog } from '../services/actions';
import { success } from '../services/haptics';

type Step = 'breathe' | 'tools' | 'done';

export default function Struggle() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ id?: string }>();
  const trackers = useTrackers();
  const [id, setId] = useState<string | null>(params.id ?? null);
  const [step, setStep] = useState<Step>('breathe');
  const [cycles, setCycles] = useState(0);
  const [reasons, setReasons] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string | null>(null);
  const [verse, setVerse] = useState<ScriptureRow | null>(null);
  const [earned, setEarned] = useState(0);

  useEffect(() => {
    if (!id && trackers.length === 1) setId(trackers[0].addiction.id);
  }, [id, trackers]);

  useEffect(() => {
    void (async () => {
      setReasons(id ? parseReasons(await getDetails(db, id)) : []);
      setHobbies(await getProfileValue(db, 'hobbies'));
      const [v] = await findScripturesByTags(db, ['craving', 'temptation', 'strength'], 1);
      setVerse(v ?? null);
    })();
  }, [db, id]);

  const onCycle = useCallback((n: number) => setCycles(n), []);

  const beatIt = async () => {
    if (!id) return;
    const { raysEarned } = await recordLog(db, { addictionId: id, logType: 'urging_averted' });
    success();
    setEarned(raysEarned);
    setStep('done');
  };

  if (step === 'done') {
    return (
      <Screen level={5}>
        <View className="mt-16 items-center">
          <Text className="text-7xl">🌤️</Text>
          <Title className="mt-4 text-center">You rode it out.</Title>
          <Body className="mt-2 text-center text-lg">+{earned} rays. {SUNSHINE_NOTES[Date.now() % SUNSHINE_NOTES.length]}</Body>
        </View>
        <Button className="mt-10" label="Back to today" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  if (step === 'breathe') {
    return (
      <Screen level={1}>
        <Text onPress={() => router.back()} className="mb-2 font-body-bold text-white/80">
          ‹ Back
        </Text>
        <Title light>You reached out. That’s the hardest part.</Title>
        <Body light className="mt-2">
          Urges rise, peak, and fall, like a wave. Let’s ride this one together. Breathe with the circle.
        </Body>
        <BreathingCircle onCycle={onCycle} />
        <Text className="mb-6 text-center font-body-bold text-white/70">{cycles} of 3 breaths</Text>
        <Button label={cycles >= 3 ? 'I’m a little calmer' : 'Skip ahead'} variant={cycles >= 3 ? 'sun' : 'ghost'} onPress={() => setStep('tools')} />
      </Screen>
    );
  }

  const ideas = hobbies
    ? [{ emoji: '💛', text: `Do something you love: ${hobbies}. Even 10 minutes.` }, ...COPING_IDEAS]
    : COPING_IDEAS;

  return (
    <Screen level={2}>
      <Title light>Next 15 minutes</Title>
      <Body light className="mb-5 mt-2">
        Pick one thing and do it now. Then come back and tell me how it went.
      </Body>

      {reasons.length ? (
        <Card>
          <Label>Remember why</Label>
          {reasons.map((r) => (
            <Text key={r} className="mt-2 font-display text-lg text-ink">
              • {r}
            </Text>
          ))}
        </Card>
      ) : null}

      <Card>
        <Heading className="mb-2">Try one of these</Heading>
        {ideas.slice(0, 6).map((c) => (
          <View key={c.text} className="flex-row py-2">
            <Text className="mr-3 text-xl">{c.emoji}</Text>
            <Text className="flex-1 font-body text-base text-ink">{c.text}</Text>
          </View>
        ))}
      </Card>

      {verse ? <VerseCard title="Hold on to this" text={verse.text} reference={scriptureRef(verse)} /> : null}

      <Button label="Talk it through with my sponsor" icon="💬" variant="ghost" onPress={() => router.push(`/sponsor?mode=urge${id ? `&id=${id}` : ''}`)} className="mb-4" />

      <Card>
        <Heading className="mb-3">How did it go?</Heading>
        {trackers.length > 1 && !params.id ? (
          <View className="mb-2 rounded-2xl bg-indigo p-3">
            <Label light className="mb-2">
              Which one was it?
            </Label>
            <TrackerPicker trackers={trackers} value={id} onChange={setId} />
          </View>
        ) : null}
        <Button label="I rode it out  +15 ✨" variant="sage" onPress={beatIt} disabled={!id} className="mb-2" />
        <Button label="I gave in" variant="soft" onPress={() => router.replace(`/slip?from=urge${id ? `&id=${id}` : ''}`)} />
      </Card>

      <CrisisBanner compact />
    </Screen>
  );
}
