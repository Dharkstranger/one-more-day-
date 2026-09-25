import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { Body, Heading, Label, Title } from '../components/ui/Text';
import { listCheckins } from '../db/repo/checkins';
import { listLogs } from '../db/repo/logs';
import { recentRays, totalRays } from '../db/repo/rays';
import type { CheckinRow, RayRow } from '../db/types';
import { useDashboard } from '../hooks/useDashboard';
import { findRiskWindows } from '../services/recovery/riskWindows';
import { levelFor, localDay } from '../services/sunshine/engine';
import { LEVELS } from '../services/sunshine/rules';
import { skyIsDark } from '../theme/sky';
import { copy } from '../copy/en';
import { Appear } from '../components/motion/Appear';
import { CountUp } from '../components/motion/CountUp';

const c = copy.journey;

const MOOD_ICON = ['·', '⛈️', '🌧️', '⛅', '🌤️', '☀️'];
const DAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
const RAY_LABEL = copy.journey.rayLabels;

export default function Journey() {
  const db = useSQLiteContext();
  const { data } = useDashboard();
  const [rays, setRays] = useState(0);
  const [history, setHistory] = useState<RayRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setRays(await totalRays(db));
        setHistory(await recentRays(db, 15));
        setCheckins(await listCheckins(db, 14));
        const logs = await listLogs(db, undefined, 1000);
        setPatterns(findRiskWindows(logs).map((w) => `${DAYS[w.dayOfWeek]}, ${w.timeOfDay.replace('_', ' ')} (${w.count} times)`));
      })();
    }, [db]),
  );

  const level = levelFor(rays);
  const light = skyIsDark(level.level.index);
  const byDay = new Map(checkins.map((c) => [c.day, c.mood]));
  const last14 = Array.from({ length: 14 }, (_, i) => localDay(new Date(Date.now() - (13 - i) * 86_400_000)));

  return (
    <Screen level={level.level.index} footer={<BottomNav />}>
      <Title light={light} className="mt-2">
        {c.title}
      </Title>
      <View className="mb-5 mt-1 flex-row items-center">
        <Text className="mr-1">✨</Text>
        <CountUp value={rays} className={`font-body-black text-base ${light ? 'text-sun' : 'text-ink'}`} />
        <Text className={`font-body text-base ${light ? 'text-white/85' : 'text-ink/80'}`}> {c.rays(rays).replace(/^\d+ /, '')}</Text>
      </View>

      <Appear index={1}>
      <Card>
        <Heading className="mb-3">{c.levels}</Heading>
        {LEVELS.map((l) => {
          const reached = rays >= l.minRays;
          const current = l.index === level.level.index;
          return (
            <View key={l.name} className="mb-3 flex-row items-center">
              <View className={`mr-3 h-9 w-9 items-center justify-center rounded-full ${reached ? 'bg-sun' : 'bg-cloud'}`}>
                <Text>{reached ? '☀️' : '○'}</Text>
              </View>
              <View className="flex-1">
                <Text className={`font-body-black ${current ? 'text-ink' : reached ? 'text-ink/70' : 'text-mist'}`}>
                  {l.name} {current ? c.youAreHere : ''}
                </Text>
                <Text className="font-body text-xs text-mist">{reached ? l.line : `${l.minRays} rays`}</Text>
              </View>
            </View>
          );
        })}
      </Card>
      </Appear>

      <Appear index={2}>
      <Card>
        <Heading className="mb-3">{c.last14}</Heading>
        <View className="flex-row flex-wrap justify-between">
          {last14.map((d) => (
            <View key={d} className="mb-2 w-[13%] items-center">
              <Text className="text-xl">{MOOD_ICON[byDay.get(d) ?? 0]}</Text>
              <Text className="font-body text-[10px] text-mist">{d.slice(8)}</Text>
            </View>
          ))}
        </View>
        <Text className="mt-1 font-body text-xs text-mist">{c.weather}</Text>
      </Card>
      </Appear>

      {data?.trackers.length ? (
        <Appear index={2}>
        <Card>
          <Heading className="mb-2">{c.fighting}</Heading>
          {data.trackers.map((t) => (
            <Pressable key={t.addiction.id} onPress={() => router.push(`/track/${t.addiction.id}`)} className="flex-row items-center justify-between border-b border-ink/5 py-3">
              <Text className="font-body-bold text-base text-ink">
                {t.details?.emoji ?? '✨'} {t.addiction.name}
              </Text>
              <Text className="font-body text-mist">
                {t.details?.mode === 'observe' ? c.thisWeek(t.stats.weeklyCounts[3]) : c.streak(t.progress.streakDays, t.stats.longestStreakDays)} ›
              </Text>
            </Pressable>
          ))}
        </Card>
      </Appear>
      ) : null}

      <Appear index={3}>
      <Card>
        <Heading className="mb-2">{c.patterns}</Heading>
        {patterns.length ? (
          <>
            <Body className="mb-2 text-sm">{c.patternsBody}</Body>
            {patterns.map((p) => (
              <Text key={p} className="font-body-bold text-ink">
                • {p}
              </Text>
            ))}
          </>
        ) : (
          <Body className="text-sm">{c.patternsEmpty}</Body>
        )}
      </Card>
      </Appear>

      <Appear index={4}>
      <Card>
        <Label className="mb-2">{c.recent}</Label>
        {history.map((r) => (
          <View key={r.id} className="flex-row justify-between py-1">
            <Text className="font-body text-ink">{RAY_LABEL[r.kind] ?? r.kind}</Text>
            <Text className="font-body-black text-amber">+{r.amount}</Text>
          </View>
        ))}
      </Card>
      </Appear>
    </Screen>
  );
}
