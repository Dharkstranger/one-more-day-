import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { SkyHero } from '../components/SkyHero';
import { TrackerCard } from '../components/TrackerCard';
import { VerseCard } from '../components/VerseCard';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Screen } from '../components/ui/Screen';
import { Body, Label, Title } from '../components/ui/Text';
import { useDashboard } from '../hooks/useDashboard';
import { scriptureRef } from '../db/repo/scriptures';
import { skyIsDark } from '../theme/sky';

const MOODS = ['', '⛈️', '🌧️', '⛅', '🌤️', '☀️'];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Still up? You’re not alone';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { data } = useDashboard();
  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-indigo">
        <ActivityIndicator color="#FFD166" />
      </View>
    );
  }
  if (data.trackers.length === 0) return <Redirect href="/welcome" />;

  const { level } = data;
  const light = skyIsDark(level.level.index);

  return (
    <Screen level={level.level.index} footer={<BottomNav />}>
      <View className="mt-2 flex-row items-center justify-between">
        <Label light={light}>{greeting()}</Label>
        <View className="flex-row items-center rounded-full bg-night/30 px-3 py-1">
          <Text className="mr-1">✨</Text>
          <Text className="font-body-black text-sm text-sun">{data.rays} rays</Text>
        </View>
      </View>

      <SkyHero height={level.level.index + level.fraction} weather={data.weather} />

      <View className="mb-5 mt-1 items-center">
        <Title light={light} className="text-center">
          {level.level.name}
        </Title>
        <Body light={light} className="mt-1 text-center">
          {level.level.line}
        </Body>
        {level.next ? (
          <View className="mt-3 w-full px-6">
            <ProgressBar value={level.fraction} dark={light} />
            <Text className={`mt-1 text-center font-body-semi text-xs ${light ? 'text-white/70' : 'text-ink/60'}`}>
              {level.raysToNext} rays to {level.next.name}
            </Text>
          </View>
        ) : null}
      </View>

      {data.celebrate ? (
        <View className="mb-4 rounded-[28px] bg-sun p-5">
          <Text className="font-display-bold text-2xl text-ink">🎉 {data.celebrate.day} days without {data.celebrate.name}!</Text>
          <Text className="mt-1 font-body text-ink/80">That’s real. That’s you. Your light just got brighter.</Text>
        </View>
      ) : null}

      <Button label="I’m struggling right now" icon="🆘" onPress={() => router.push('/struggle')} className="mb-3" />
      {data.today ? (
        <View className="mb-5 flex-row items-center justify-center rounded-full bg-night/25 py-3">
          <Text className="mr-2 text-lg">{MOODS[data.today.mood]}</Text>
          <Text className={`font-body-bold ${light ? 'text-white' : 'text-ink'}`}>Checked in today. One more day.</Text>
        </View>
      ) : (
        <Button label="Check in for today  +10 ✨" variant={light ? 'ghost' : 'dark'} onPress={() => router.push('/checkin')} className="mb-5" />
      )}

      {data.trackers.map((t) => (
        <TrackerCard key={t.addiction.id} t={t} />
      ))}

      {data.verse ? <VerseCard text={data.verse.text} reference={scriptureRef(data.verse)} /> : null}

      <Button label="Track something else" icon="＋" variant={light ? 'ghost' : 'soft'} onPress={() => router.push('/track/new')} />
    </Screen>
  );
}
