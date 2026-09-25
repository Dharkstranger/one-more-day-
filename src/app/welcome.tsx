import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { SkyHero } from '../components/SkyHero';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { Body, Title } from '../components/ui/Text';
import { Appear } from '../components/motion/Appear';
import { copy } from '../copy/en';

const LOOK = [
  { level: 0, height: 0.2 },
  { level: 1, height: 1.4 },
  { level: 3, height: 3.2 },
];
const SLIDES = copy.welcome.slides.map((text, i) => ({ ...text, ...LOOK[i] }));
const w = copy.welcome;

export default function Welcome() {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;

  return (
    <Screen level={s.level}>
      <SkyHero height={s.height} weather="clear" />
      <Appear key={i}>
        <View className="mt-2">
          <Title light>{s.title}</Title>
          <Body light className="mt-3 text-lg leading-7">
            {s.body}
          </Body>
        </View>
      </Appear>

      <View className="my-8 flex-row justify-center gap-2">
        {SLIDES.map((_, j) => (
          <View key={j} className={`h-2 rounded-full ${j === i ? 'w-8 bg-sun' : 'w-2 bg-white/40'}`} />
        ))}
      </View>

      <Button label={last ? w.begin : w.next} onPress={() => (last ? router.replace('/track/new?first=1') : setI(i + 1))} />
      {!last ? (
        <Text onPress={() => setI(SLIDES.length - 1)} className="mt-4 text-center font-body-bold text-white/70">
          {w.skip}
        </Text>
      ) : (
        <Text className="mt-4 text-center font-body text-sm text-white/70">
          {w.unsure}
        </Text>
      )}
    </Screen>
  );
}
