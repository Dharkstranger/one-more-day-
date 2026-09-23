import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { SkyHero } from '../components/SkyHero';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/ui/Screen';
import { Body, Title } from '../components/ui/Text';

const SLIDES = [
  {
    level: 0,
    height: 0.2,
    title: 'One more day.',
    body: 'That’s all we ask. Not forever. Not perfect. Just today. Whatever you’re fighting (a drink, a screen, a bet, a habit), you don’t fight it alone here.',
  },
  {
    level: 1,
    height: 1.4,
    title: 'Your light never goes out.',
    body: 'Every check-in, every urge you beat, even every honest slip earns rays of light. A slip restarts a count. It never takes your light away.',
  },
  {
    level: 3,
    height: 3.2,
    title: 'Private. Free. Forever.',
    body: 'No sign-up. No ads. No tracking. What you log stays on this device. The code is open for anyone to check.',
  },
];

export default function Welcome() {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;

  return (
    <Screen level={s.level}>
      <SkyHero height={s.height} weather="clear" />
      <View className="mt-2">
        <Title light>{s.title}</Title>
        <Body light className="mt-3 text-lg leading-7">
          {s.body}
        </Body>
      </View>

      <View className="my-8 flex-row justify-center gap-2">
        {SLIDES.map((_, j) => (
          <View key={j} className={`h-2 rounded-full ${j === i ? 'w-8 bg-sun' : 'w-2 bg-white/40'}`} />
        ))}
      </View>

      <Button label={last ? 'Let’s begin' : 'Next'} onPress={() => (last ? router.replace('/track/new?first=1') : setI(i + 1))} />
      {!last ? (
        <Text onPress={() => setI(SLIDES.length - 1)} className="mt-4 text-center font-body-bold text-white/70">
          Skip
        </Text>
      ) : (
        <Text className="mt-4 text-center font-body text-sm text-white/70">
          Not sure you have a problem? That’s fine. You can just watch how often it happens.
        </Text>
      )}
    </Screen>
  );
}
