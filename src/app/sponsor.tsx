import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNav } from '../components/BottomNav';
import { CrisisBanner } from '../components/CrisisBanner';
import { Chip } from '../components/ui/Chip';
import { Label, Title } from '../components/ui/Text';
import { getAddiction } from '../db/repo/addictions';
import { setProfileValue } from '../db/repo/profile';
import type { AddictionRow } from '../db/types';
import { useSponsor } from '../hooks/useSponsor';
import type { SponsorMode } from '../services/ai/contract';
import { SKY_GRADIENTS } from '../theme/sky';
import { tap } from '../services/haptics';
import { copy } from '../copy/en';
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';

const c = copy.sponsor;

const OPENERS: Record<SponsorMode, { hello: string; prompts: string[] }> = {
  urge: {
    hello: 'I’m here. Tell me what’s pulling at you right now. We’ll get through the next few minutes together.',
    prompts: ['The urge is really strong', 'I’m bored and restless', 'Something upset me'],
  },
  slip: {
    hello: 'Thank you for coming here instead of hiding. No lecture. Do you want to tell me what happened?',
    prompts: ['I want to talk about it', 'I feel ashamed', 'I don’t know why I did it'],
  },
  checkin: {
    hello: 'How are you really doing today?',
    prompts: ['Today was good', 'I’m tired', 'I’m worried about tonight'],
  },
  chat: {
    hello: 'Hi. I’m your One More Day companion. I’m not a doctor or a pastor, just someone in your corner. What’s on your mind?',
    prompts: ['I’m struggling', 'Help me understand my triggers', 'Give me a verse for today'],
  },
};

export default function Sponsor() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ mode?: SponsorMode; id?: string; log?: string }>();
  const mode: SponsorMode = params.mode && params.mode in OPENERS ? params.mode : 'chat';
  const [addiction, setAddiction] = useState<AddictionRow | null>(null);
  const [text, setText] = useState('');
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    if (params.id) void getAddiction(db, params.id).then(setAddiction);
  }, [db, params.id]);

  const { messages, pending, showCrisis, profileSuggestions, send, dismissSuggestion } = useSponsor({
    mode,
    addiction,
    logId: params.log,
  });

  const submit = (value: string) => {
    if (!value.trim() || pending) return;
    tap();
    setText('');
    void send(value);
  };

  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length, pending]);

  const opener = OPENERS[mode];

  return (
    <LinearGradient colors={SKY_GRADIENTS[1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="w-full max-w-[520px] flex-1 self-center px-5">
            <View className="flex-row items-center justify-between py-2">
              {params.mode ? (
                <Text onPress={() => router.back()} className="font-body-bold text-white/80">
                  {c.back}
                </Text>
              ) : (
                <View />
              )}
              <Label light>{c.private}</Label>
            </View>
            <Title light className="mb-3">
              {c.title}
            </Title>

            <ScrollView ref={scroll} className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
              {showCrisis ? <CrisisBanner /> : null}
              <Bubble role="assistant" text={opener.hello} />
              {messages.map((m, i) => (
                <View key={i}>
                  <Bubble role={m.role} text={m.content} />
                  {m.verse ? (
                    <View className="mb-3 ml-2 mr-10 rounded-2xl border border-sun/40 bg-night/40 p-4">
                      <Text className="font-display text-base leading-6 text-white">“{m.verse.text.replace(/^[“"]|[”"]$/g, '')}”</Text>
                      <Text className="mt-1 font-body-bold text-sm text-sun">{m.verse.reference}</Text>
                      {m.prayerChapter ? <Text className="mt-2 font-body text-sm text-white/80">Pray through {m.prayerChapter}</Text> : null}
                    </View>
                  ) : null}
                </View>
              ))}
              {pending ? <Bubble role="assistant" text="…" /> : null}

              {profileSuggestions.map((s) => (
                <View key={s.key} className="mb-3 rounded-2xl bg-cream p-4">
                  <Text className="font-body-semi text-ink">
                    {c.remember} <Text className="font-body-black">{s.key.replace('_', ' ')}:</Text> {s.value}
                  </Text>
                  <View className="mt-2 flex-row">
                    <Chip
                      label={c.yes}
                      selected
                      onPress={async () => {
                        await setProfileValue(db, s.key, s.value);
                        dismissSuggestion(s.key);
                      }}
                    />
                    <Chip label={c.no} selected={false} onPress={() => dismissSuggestion(s.key)} />
                  </View>
                </View>
              ))}

              {messages.length === 0 ? (
                <View className="mt-2 flex-row flex-wrap">
                  {opener.prompts.map((p) => (
                    <Chip key={p} dark label={p} selected={false} onPress={() => submit(p)} />
                  ))}
                </View>
              ) : null}
            </ScrollView>

            <View className={`flex-row items-end gap-2 ${params.mode ? 'pb-4' : 'pb-28'}`}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={c.placeholder}
                placeholderTextColor="#A7A9C9"
                multiline
                maxLength={2000}
                onSubmitEditing={() => submit(text)}
                className="max-h-32 flex-1 rounded-3xl bg-white/15 px-4 py-3 font-body text-base text-white"
              />
              <Text
                accessibilityRole="button"
                accessibilityLabel="Send"
                onPress={() => submit(text)}
                className={`rounded-full px-5 py-3 font-body-black text-base ${text.trim() ? 'bg-sun text-ink' : 'bg-white/10 text-white/40'}`}
              >
                {c.send}
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
        {params.mode ? null : <BottomNav />}
      </SafeAreaView>
    </LinearGradient>
  );
}

function Bubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  const mine = role === 'user';
  const reduce = useReducedMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInUp.duration(320).springify().damping(16)}
      style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%', marginBottom: 12 }}
    >
      <View className={`rounded-3xl px-4 py-3 ${mine ? 'rounded-br-md bg-sun' : 'rounded-bl-md bg-cream'}`}>
        <Text className="font-body text-base leading-6 text-ink">{text}</Text>
      </View>
    </Animated.View>
  );
}
