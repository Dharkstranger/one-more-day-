import { Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Tracker } from '../hooks/useDashboard';
import { milestoneMessage } from '../services/recovery/milestones';
import { nextMilestone } from '../services/sunshine/engine';
import { MILESTONE_LADDER } from '../services/sunshine/rules';
import { copy } from '../copy/en';
import { Card } from './ui/Card';
import { ProgressBar } from './ui/ProgressBar';
import { Label } from './ui/Text';
import { Button } from './ui/Button';
import { CountUp } from './motion/CountUp';
import { PressScale } from './motion/PressScale';

const money = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0));
const t = copy.tracker;

export function TrackerCard({ t: tracker }: { t: Tracker }) {
  const { addiction, details, progress, stats } = tracker;
  const observe = details?.mode === 'observe';
  const goal = nextMilestone(progress.streakDays);
  const prevGoal = [0, ...MILESTONE_LADDER].filter((d) => d <= progress.streakDays).pop() ?? 0;
  const msg = milestoneMessage(addiction.name, addiction.category, progress);

  return (
    <Card>
      <PressScale depth={0.98} accessibilityRole="button" onPress={() => router.push(`/track/${addiction.id}`)}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="mr-2 text-2xl">{details?.emoji ?? '✨'}</Text>
            <Text className="font-body-black text-lg text-ink">{addiction.name}</Text>
          </View>
          <Text className="font-body-bold text-sm text-mist">{t.details}</Text>
        </View>

        {observe ? (
          <View className="mt-4">
            <CountUp value={stats.weeklyCounts[3]} className="font-display-bold text-5xl text-ink" />
            <Text className="font-body text-mist">{t.observeCount}</Text>
            <View className="mt-3 h-12 flex-row items-end gap-2">
              {stats.weeklyCounts.map((c, i) => (
                <View key={i} className="flex-1 items-center">
                  <View className="w-full rounded-t-lg bg-amber" style={{ height: 4 + Math.min(40, c * 6) }} />
                </View>
              ))}
            </View>
            <Label className="mt-1">{t.observeAxis}</Label>
          </View>
        ) : (
          <View className="mt-4">
            <View className="flex-row items-end">
              <CountUp value={progress.streakDays} className="font-display-bold text-6xl leading-[64px] text-ink" />
              <Text className="mb-2 ml-2 font-body-bold text-base text-mist">{t.daysFree(progress.streakDays)}</Text>
            </View>
            <View className="mt-3">
              <ProgressBar value={(progress.streakDays - prevGoal) / Math.max(1, goal - prevGoal)} />
              <Text className="mt-2 font-body-semi text-sm text-mist">{t.toMilestone(goal - progress.streakDays, goal)}</Text>
            </View>
          </View>
        )}
      </PressScale>

      {!observe && (stats.moneySaved > 0 || stats.hoursReclaimed > 0 || stats.longestStreakDays > progress.streakDays) ? (
        <View className="mt-4 flex-row gap-2">
          {stats.moneySaved > 0 ? <Stat label={t.saved} value={money(stats.moneySaved)} /> : null}
          {stats.hoursReclaimed > 0 ? <Stat label={t.hoursBack} value={String(stats.hoursReclaimed)} /> : null}
          {stats.longestStreakDays > progress.streakDays ? <Stat label={t.bestRun} value={`${stats.longestStreakDays}d`} /> : null}
        </View>
      ) : null}

      {stats.gentleMode && !observe ? (
        <Text className="mt-4 rounded-2xl bg-cloud p-3 font-body text-sm text-ink">{t.gentle(goal)}</Text>
      ) : !observe && progress.cyclesCompleted > 0 ? (
        <View className="mt-4 rounded-2xl bg-sun/40 p-3">
          <Text className="font-body-bold text-sm text-ink">{msg.title}</Text>
          <Text className="mt-1 font-body text-sm text-ink/80">{msg.body}</Text>
          {msg.safetyNote ? <Text className="mt-2 font-body-bold text-xs text-ink">{msg.safetyNote}</Text> : null}
        </View>
      ) : null}

      <View className="mt-4 flex-row gap-2">
        <Button className="flex-1" variant="sage" label={observe ? t.skipped : t.beatUrge} onPress={() => router.push(`/struggle?id=${addiction.id}`)} />
        <Button className="flex-1" variant="soft" label={observe ? t.didIt : t.slipped} onPress={() => router.push(`/slip?id=${addiction.id}`)} />
      </View>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-cloud py-3">
      <Text className="font-body-black text-lg text-ink">{value}</Text>
      <Text className="font-body-semi text-xs text-mist">{label}</Text>
    </View>
  );
}
