import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Tracker } from '../hooks/useDashboard';
import { milestoneMessage } from '../services/recovery/milestones';
import { nextMilestone } from '../services/sunshine/engine';
import { Card } from './ui/Card';
import { ProgressBar } from './ui/ProgressBar';
import { Label } from './ui/Text';
import { Button } from './ui/Button';

const money = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0));

export function TrackerCard({ t }: { t: Tracker }) {
  const { addiction, details, progress, stats } = t;
  const observe = details?.mode === 'observe';
  const goal = nextMilestone(progress.streakDays);
  const prevGoal = [0, 1, 3, 7, 14, 21, 30, 45, 60, 90, 120, 180, 270, 365].filter((d) => d <= progress.streakDays).pop() ?? 0;
  const toGoal = goal - progress.streakDays;
  const msg = milestoneMessage(addiction.name, addiction.category, progress);

  return (
    <Card>
      <Pressable accessibilityRole="button" onPress={() => router.push(`/track/${addiction.id}`)}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="mr-2 text-2xl">{details?.emoji ?? '✨'}</Text>
            <Text className="font-body-black text-lg text-ink">{addiction.name}</Text>
          </View>
          <Text className="font-body-bold text-sm text-mist">Details ›</Text>
        </View>

        {observe ? (
          <View className="mt-4">
            <Text className="font-display-bold text-5xl text-ink">{stats.weeklyCounts[3]}</Text>
            <Text className="font-body text-mist">times in the last 7 days · just watching for now</Text>
            <View className="mt-3 h-12 flex-row items-end gap-2">
              {stats.weeklyCounts.map((c, i) => (
                <View key={i} className="flex-1 items-center">
                  <View className="w-full rounded-t-lg bg-amber" style={{ height: 4 + Math.min(40, c * 6) }} />
                </View>
              ))}
            </View>
            <Label className="mt-1">4 weeks ago → this week</Label>
          </View>
        ) : (
          <View className="mt-4">
            <View className="flex-row items-end">
              <Text className="font-display-bold text-6xl leading-[64px] text-ink">{progress.streakDays}</Text>
              <Text className="mb-2 ml-2 font-body-bold text-base text-mist">{progress.streakDays === 1 ? 'day' : 'days'} free</Text>
            </View>
            <View className="mt-3">
              <ProgressBar value={(progress.streakDays - prevGoal) / Math.max(1, goal - prevGoal)} />
              <Text className="mt-2 font-body-semi text-sm text-mist">
                {toGoal} {toGoal === 1 ? 'day' : 'days'} to your {goal}-day milestone
              </Text>
            </View>
          </View>
        )}
      </Pressable>

      {!observe && (stats.moneySaved > 0 || stats.hoursReclaimed > 0 || stats.longestStreakDays > progress.streakDays) ? (
        <View className="mt-4 flex-row gap-2">
          {stats.moneySaved > 0 ? <Stat label="saved" value={money(stats.moneySaved)} /> : null}
          {stats.hoursReclaimed > 0 ? <Stat label="hours back" value={String(stats.hoursReclaimed)} /> : null}
          {stats.longestStreakDays > progress.streakDays ? <Stat label="best run" value={`${stats.longestStreakDays}d`} /> : null}
        </View>
      ) : null}

      {stats.gentleMode && !observe ? (
        <Text className="mt-4 rounded-2xl bg-cloud p-3 font-body text-sm text-ink">
          It’s been a hard couple of weeks. That’s okay. Forget the big number: aim for {goal === 1 ? 'today' : `${goal} days`}. We’re right here.
        </Text>
      ) : !observe && progress.cyclesCompleted > 0 ? (
        <View className="mt-4 rounded-2xl bg-sun/40 p-3">
          <Text className="font-body-bold text-sm text-ink">{msg.title}</Text>
          <Text className="mt-1 font-body text-sm text-ink/80">{msg.body}</Text>
          {msg.safetyNote ? <Text className="mt-2 font-body-bold text-xs text-ink">{msg.safetyNote}</Text> : null}
        </View>
      ) : null}

      <View className="mt-4 flex-row gap-2">
        <Button className="flex-1" variant="sage" label={observe ? 'Skipped it' : 'Beat an urge'} onPress={() => router.push(`/struggle?id=${addiction.id}`)} />
        <Button className="flex-1" variant="soft" label={observe ? 'I did it' : 'I slipped'} onPress={() => router.push(`/slip?id=${addiction.id}`)} />
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
