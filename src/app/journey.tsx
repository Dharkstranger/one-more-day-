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

const MOOD_ICON = ['·', '⛈️', '🌧️', '⛅', '🌤️', '☀️'];
const DAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
const RAY_LABEL: Record<string, string> = {
  first_step: 'Took the first step',
  checkin: 'Checked in',
  urge_beaten: 'Beat an urge',
  honest_slip: 'Was honest about a slip',
  reflection: 'Talked it through',
  milestone: 'Reached a milestone',
};

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
        Your journey
      </Title>
      <Body light={light} className="mb-5 mt-1">
        ✨ {rays} rays of light, earned and kept.
      </Body>

      <Card>
        <Heading className="mb-3">From night to sunshine</Heading>
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
                  {l.name} {current ? '· you are here' : ''}
                </Text>
                <Text className="font-body text-xs text-mist">{reached ? l.line : `${l.minRays} rays`}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      <Card>
        <Heading className="mb-3">Last 14 days</Heading>
        <View className="flex-row flex-wrap justify-between">
          {last14.map((d) => (
            <View key={d} className="mb-2 w-[13%] items-center">
              <Text className="text-xl">{MOOD_ICON[byDay.get(d) ?? 0]}</Text>
              <Text className="font-body text-[10px] text-mist">{d.slice(8)}</Text>
            </View>
          ))}
        </View>
        <Text className="mt-1 font-body text-xs text-mist">Your daily check-in weather.</Text>
      </Card>

      {data?.trackers.length ? (
        <Card>
          <Heading className="mb-2">What you’re fighting</Heading>
          {data.trackers.map((t) => (
            <Pressable key={t.addiction.id} onPress={() => router.push(`/track/${t.addiction.id}`)} className="flex-row items-center justify-between border-b border-ink/5 py-3">
              <Text className="font-body-bold text-base text-ink">
                {t.details?.emoji ?? '✨'} {t.addiction.name}
              </Text>
              <Text className="font-body text-mist">
                {t.details?.mode === 'observe' ? `${t.stats.weeklyCounts[3]} this week` : `${t.progress.streakDays}d · best ${t.stats.longestStreakDays}d`} ›
              </Text>
            </Pressable>
          ))}
        </Card>
      ) : null}

      <Card>
        <Heading className="mb-2">Your patterns</Heading>
        {patterns.length ? (
          <>
            <Body className="mb-2 text-sm">These are the times it tends to get hard. We’ll try to check in with you before them.</Body>
            {patterns.map((p) => (
              <Text key={p} className="font-body-bold text-ink">
                • {p}
              </Text>
            ))}
          </>
        ) : (
          <Body className="text-sm">After a few logs, you’ll see when urges tend to hit, so you can plan ahead.</Body>
        )}
      </Card>

      <Card>
        <Label className="mb-2">Recent light</Label>
        {history.map((r) => (
          <View key={r.id} className="flex-row justify-between py-1">
            <Text className="font-body text-ink">{RAY_LABEL[r.kind] ?? r.kind}</Text>
            <Text className="font-body-black text-amber">+{r.amount}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
