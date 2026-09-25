import { useCallback, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BottomNav } from '../components/BottomNav';
import { CrisisBanner } from '../components/CrisisBanner';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Screen } from '../components/ui/Screen';
import { Body, Heading, Label, Title } from '../components/ui/Text';
import { listAddictions } from '../db/repo/addictions';
import { exportBackup, restoreBackup, validateBackup, wipeUserData, type BackupFile } from '../db/repo/backup';
import { getProfileValue, PROFILE_KEYS, setProfileValue, SETTING_PREFIX, type ProfileKey } from '../db/repo/profile';
import { pickBackupFile, saveBackupFile } from '../services/backup/io';
import { buildDailyCheckInUrl } from '../services/calendar/googleCalendar';
import { localDay } from '../services/sunshine/engine';
import { copy } from '../copy/en';
import { Appear } from '../components/motion/Appear';
import { BIBLE_LANGUAGES, BIBLE_LANGUAGE_NAMES, type BibleLanguage } from '../services/scripture/contract';
import { getBibleLanguage, setBibleLanguage } from '../services/scripture/prefs';

const c = copy.settings;

const REPO_URL = 'https://github.com/Dharkstranger/one-more-day-';
const HOURS = [7, 9, 12, 18, 20, 22];
const PROFILE_LABELS: Record<ProfileKey, { label: string; hint: string }> = {
  hobbies: { label: 'Things you enjoy', hint: 'e.g. guitar, football, cooking' },
  work: { label: 'Your work or days', hint: 'e.g. night shifts, student, stay-at-home parent' },
  personality: { label: 'How you’d describe yourself', hint: 'e.g. introvert, restless, people-pleaser' },
  faith_background: { label: 'Faith', hint: 'e.g. Christian, exploring, not religious' },
  known_triggers: { label: 'What sets it off', hint: 'e.g. payday, arguments, being alone at night' },
  support_people: { label: 'Who is in your corner', hint: 'e.g. my sister, my pastor (no full names)' },
};

export default function Settings() {
  const db = useSQLiteContext();
  const [hour, setHour] = useState(20);
  const [profile, setProfile] = useState<Partial<Record<ProfileKey, string>>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(0);
  const [bibleLang, setBibleLang] = useState<BibleLanguage>('en');

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const entries = await Promise.all(PROFILE_KEYS.map(async (k) => [k, (await getProfileValue(db, k)) ?? ''] as const));
        setProfile(Object.fromEntries(entries));
        const h = await getProfileValue(db, `${SETTING_PREFIX}reminder_hour`);
        if (h) setHour(parseInt(h, 10));
        setBibleLang(await getBibleLanguage(db));
      })();
    }, [db]),
  );

  const addReminder = async () => {
    const trackers = await listAddictions(db);
    await setProfileValue(db, `${SETTING_PREFIX}reminder_hour`, String(hour));
    const url = buildDailyCheckInUrl({
      addictionNames: trackers.map((t) => t.name),
      days: Math.max(30, ...trackers.map((t) => t.interval_days)),
      hour,
      minute: 0,
      appLink: ExpoLinking.createURL('checkin'),
    });
    await Linking.openURL(url);
  };

  const saveProfile = async () => {
    for (const k of PROFILE_KEYS) await setProfileValue(db, k, (profile[k] ?? '').trim());
    setStatus(c.saved);
  };

  const backup = async () => {
    const data = await exportBackup(db);
    await saveBackupFile(`one-more-day-backup-${localDay()}.json`, JSON.stringify(data, null, 2));
    setStatus(c.backupReady);
  };

  const restore = async () => {
    const text = await pickBackupFile();
    if (!text) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return setStatus(c.unreadable);
    }
    const error = validateBackup(parsed);
    if (error) return setStatus(error);
    await restoreBackup(db, parsed as BackupFile);
    setStatus(c.restored);
    router.replace('/');
  };

  const wipe = async () => {
    if (confirmWipe < 1) return setConfirmWipe(1);
    await wipeUserData(db);
    router.replace('/welcome');
  };

  return (
    <Screen level={2} footer={<BottomNav />}>
      <Title light className="mt-2">
        {c.title}
      </Title>
      <Body light className="mb-5 mt-1">
        {c.subtitle}
      </Body>
      {status ? <Text className="mb-4 rounded-2xl bg-sun p-3 font-body-bold text-ink">{status}</Text> : null}

      <Appear>
        <Card>
          <Heading>{c.bibleTitle}</Heading>
          <Body className="mb-3 mt-1 text-sm">{c.bibleBody}</Body>
          <View className="flex-row flex-wrap">
            {BIBLE_LANGUAGES.map((l) => (
              <Chip
                key={l}
                label={BIBLE_LANGUAGE_NAMES[l]}
                selected={bibleLang === l}
                onPress={async () => {
                  setBibleLang(l);
                  await setBibleLanguage(db, l);
                }}
              />
            ))}
          </View>
          {bibleLang === 'he' ? <Body className="mt-1 text-xs">{c.bibleNote}</Body> : null}
        </Card>
      </Appear>

      <Card>
        <Heading>{c.reminderTitle}</Heading>
        <Body className="mb-3 mt-1 text-sm">
          {c.reminderBody}
        </Body>
        <Label className="mb-2">{c.remindAt}</Label>
        <View className="mb-2 flex-row flex-wrap">
          {HOURS.map((h) => (
            <Chip key={h} label={`${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`} selected={hour === h} onPress={() => setHour(h)} />
          ))}
        </View>
        <Button label={c.addCalendar} icon="📅" variant="dark" onPress={addReminder} />
      </Card>

      <Card>
        <Heading>{c.aboutTitle}</Heading>
        <Body className="mb-4 mt-1 text-sm">
          {c.aboutBody}
        </Body>
        {PROFILE_KEYS.map((k) => (
          <Field key={k} label={PROFILE_LABELS[k].label} value={profile[k] ?? ''} onChangeText={(v) => setProfile({ ...profile, [k]: v })} placeholder={PROFILE_LABELS[k].hint} maxLength={200} />
        ))}
        <Button label={c.save} variant="dark" onPress={saveProfile} />
      </Card>

      <Card>
        <Heading>{c.backupTitle}</Heading>
        <Body className="mb-4 mt-1 text-sm">
          {c.backupBody}
        </Body>
        <Button label={c.download} icon="⬇️" variant="dark" onPress={backup} className="mb-2" />
        <Button label={c.restore} icon="⬆️" variant="soft" onPress={restore} />
      </Card>

      <CrisisBanner compact />

      <Card>
        <Heading>{c.openTitle}</Heading>
        <Body className="mt-1 text-sm">
          {c.openBody}
        </Body>
        <Text onPress={() => Linking.openURL(REPO_URL)} className="mt-3 font-body-black text-amber underline">
          {c.viewCode}
        </Text>
        <Text className="mt-3 font-body text-xs text-mist">
          {c.legal}
        </Text>
      </Card>

      <Card>
        <Heading>{c.deleteTitle}</Heading>
        <Body className="mb-3 mt-1 text-sm">
          {confirmWipe ? c.deleteConfirmBody : c.deleteBody}
        </Body>
        <Button label={confirmWipe ? c.deleteConfirm : c.deleteButton} variant={confirmWipe ? 'dark' : 'soft'} onPress={wipe} />
        {confirmWipe ? (
          <Text onPress={() => setConfirmWipe(0)} className="mt-3 text-center font-body-bold text-mist">
            {c.cancel}
          </Text>
        ) : null}
      </Card>
    </Screen>
  );
}
