import { useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { SkyHero } from '../components/SkyHero';
import { TrackerCard } from '../components/TrackerCard';
import { VerseCard } from '../components/VerseCard';
import { Appear } from '../components/motion/Appear';
import { useCelebrate } from '../components/motion/Celebration';
import { CountUp } from '../components/motion/CountUp';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Screen } from '../components/ui/Screen';
import { Body, Label, Title } from '../components/ui/Text';
import { copy } from '../copy/en';
import { useDashboard } from '../hooks/useDashboard';
import { scriptureRef } from '../db/repo/scriptures';
import { milestoneRays } from '../services/sunshine/rules';
import { skyIsDark } from '../theme/sky';

const MOODS = ['', '⛈️', '🌧️', '⛅', '🌤️', '☀️'];
const c = copy.home;

export default function Home() {
  const { data } = useDashboard();
  const celebrate = useCelebrate();

  useEffect(() => {
    if (data?.celebrate) celebrate(milestoneRays(data.celebrate.day));
  }, [data?.celebrate, celebrate]);

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
        <Label light={light}>{copy.greeting(new Date().getHours())}</Label>
        <View className="flex-row items-center rounded-full bg-night/30 px-3 py-1" accessibilityLabel={c.rays(data.rays)}>
          <Text className="mr-1">✨</Text>
          <CountUp value={data.rays} className="font-body-black text-sm text-sun" />
          <Text className="font-body-black text-sm text-sun"> rays</Text>
        </View>
      </View>

      <SkyHero height={level.level.index + level.fraction} weather={data.weather} />

      <Appear>
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
                {c.toNext(level.raysToNext, level.next.name)}
              </Text>
            </View>
          ) : null}
        </View>
      </Appear>

      {data.celebrate ? (
        <Appear>
          <View className="mb-4 rounded-[28px] bg-sun p-5">
            <Text className="font-display-bold text-2xl text-ink">🎉 {c.milestone(data.celebrate.day, data.celebrate.name)}</Text>
            <Text className="mt-1 font-body text-ink/80">{c.milestoneBody}</Text>
          </View>
        </Appear>
      ) : null}

      <Appear index={1}>
        <Button label={c.struggle} icon="🆘" onPress={() => router.push('/struggle')} className="mb-3" />
        {data.today ? (
          <View className="mb-5 flex-row items-center justify-center rounded-full bg-night/25 py-3">
            <Text className="mr-2 text-lg">{MOODS[data.today.mood]}</Text>
            <Text className={`font-body-bold ${light ? 'text-white' : 'text-ink'}`}>{c.checkedIn}</Text>
          </View>
        ) : (
          <Button label={`${c.checkIn}  +10 ✨`} variant={light ? 'ghost' : 'dark'} onPress={() => router.push('/checkin')} className="mb-5" />
        )}
      </Appear>

      {data.trackers.map((t, i) => (
        <Appear key={t.addiction.id} index={i + 2}>
          <TrackerCard t={t} />
        </Appear>
      ))}

      {data.verse ? (
        <Appear index={data.trackers.length + 2}>
          <VerseCard title={c.wordToday} text={data.verse.text} reference={scriptureRef(data.verse)} rtl={data.verse.translation === 'WLC'} />
        </Appear>
      ) : null}

      <Button label={c.addTracker} icon="＋" variant={light ? 'ghost' : 'soft'} onPress={() => router.push('/track/new')} />
    </Screen>
  );
}
