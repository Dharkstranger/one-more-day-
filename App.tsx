import './global.css';
import { Suspense, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SQLiteProvider } from 'expo-sqlite';
import { DATABASE_NAME, migrateDbIfNeeded } from './src/db';
import type { AddictionCategory } from './src/db';
import { StreakCard } from './src/components/StreakCard';
import { useAddictions } from './src/hooks/useAddictions';
import { useLogs } from './src/hooks/useLogs';
import { buildDailyCheckInUrl } from './src/services/calendar/googleCalendar';

export default function App() {
  return (
    <SafeAreaProvider>
      <Suspense fallback={<ActivityIndicator className="flex-1" />}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded} useSuspense>
          <HomeScreen />
        </SQLiteProvider>
      </Suspense>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

// Placeholder home screen that exercises the data layer end to end.
// Real screens (onboarding, sponsor chat, history, settings) come next.
function HomeScreen() {
  const { items, reload, add } = useAddictions();
  const { log } = useLogs();

  const record = async (addictionId: string, logType: 'urging_averted' | 'slip') => {
    await log({ addictionId, logType });
    await reload();
  };

  const openCalendar = () => {
    const url = buildDailyCheckInUrl({
      addictionNames: items.map((i) => i.addiction.name),
      days: Math.max(30, ...items.map((i) => i.addiction.interval_days)),
      hour: 20,
      minute: 0,
      appLink: ExpoLinking.createURL('checkin'),
    });
    void Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <ScrollView contentContainerClassName="p-4">
        <Text className="mb-1 text-3xl font-bold text-slate-900">One More Day</Text>
        <Text className="mb-6 text-slate-600">Everything you log stays on this phone.</Text>

        {items.map((item) => (
          <StreakCard
            key={item.addiction.id}
            item={item}
            onUrgeBeaten={() => record(item.addiction.id, 'urging_averted')}
            onSlip={() => record(item.addiction.id, 'slip')}
          />
        ))}

        <AddAddictionForm onAdd={(name, category, intervalDays) => add({ name, category, intervalDays })} />

        {items.length > 0 ? (
          <Pressable onPress={openCalendar} className="mt-4 items-center rounded-xl bg-slate-900 py-3">
            <Text className="font-semibold text-white">Add daily check-in to Google Calendar</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const CATEGORIES: AddictionCategory[] = ['substance', 'behavioral', 'digital'];

function AddAddictionForm({ onAdd }: { onAdd: (name: string, c: AddictionCategory, days: number) => Promise<unknown> }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AddictionCategory>('substance');
  const [days, setDays] = useState('60');

  const submit = async () => {
    const interval = parseInt(days, 10);
    if (!name.trim() || !Number.isFinite(interval) || interval < 1) return;
    await onAdd(name, category, interval);
    setName('');
  };

  return (
    <View className="rounded-2xl bg-white p-5">
      <Text className="mb-3 text-lg font-semibold text-slate-900">What are you tracking?</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. alcohol, weed, gambling, social media"
        className="mb-3 rounded-lg border border-slate-300 px-3 py-2 text-base"
      />
      <View className="mb-3 flex-row gap-2">
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            className={`rounded-full px-3 py-1 ${c === category ? 'bg-slate-900' : 'bg-slate-200'}`}
          >
            <Text className={c === category ? 'text-white' : 'text-slate-800'}>{c}</Text>
          </Pressable>
        ))}
      </View>
      <Text className="mb-1 text-slate-600">Milestone every how many days?</Text>
      <TextInput
        value={days}
        onChangeText={setDays}
        keyboardType="number-pad"
        className="mb-4 rounded-lg border border-slate-300 px-3 py-2 text-base"
      />
      <Pressable onPress={submit} className="items-center rounded-xl bg-emerald-600 py-3">
        <Text className="font-semibold text-white">Start counting</Text>
      </Pressable>
    </View>
  );
}
