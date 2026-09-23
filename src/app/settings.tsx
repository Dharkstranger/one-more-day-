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

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        const entries = await Promise.all(PROFILE_KEYS.map(async (k) => [k, (await getProfileValue(db, k)) ?? ''] as const));
        setProfile(Object.fromEntries(entries));
        const h = await getProfileValue(db, `${SETTING_PREFIX}reminder_hour`);
        if (h) setHour(parseInt(h, 10));
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
    setStatus('Saved. Your sponsor will use this to give better ideas.');
  };

  const backup = async () => {
    const data = await exportBackup(db);
    await saveBackupFile(`one-more-day-backup-${localDay()}.json`, JSON.stringify(data, null, 2));
    setStatus('Backup ready. Keep it somewhere safe. It holds your private history.');
  };

  const restore = async () => {
    const text = await pickBackupFile();
    if (!text) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return setStatus('That file couldn’t be read.');
    }
    const error = validateBackup(parsed);
    if (error) return setStatus(error);
    await restoreBackup(db, parsed as BackupFile);
    setStatus('Restored. Welcome back.');
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
        Settings
      </Title>
      <Body light className="mb-5 mt-1">
        Everything here stays on this device.
      </Body>
      {status ? <Text className="mb-4 rounded-2xl bg-sun p-3 font-body-bold text-ink">{status}</Text> : null}

      <Card>
        <Heading>Daily reminder</Heading>
        <Body className="mb-3 mt-1 text-sm">
          Adds one repeating “One More Day” check-in to your Google Calendar. We never sign in to your Google account. You just tap Save.
        </Body>
        <Label className="mb-2">Remind me at</Label>
        <View className="mb-2 flex-row flex-wrap">
          {HOURS.map((h) => (
            <Chip key={h} label={`${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`} selected={hour === h} onPress={() => setHour(h)} />
          ))}
        </View>
        <Button label="Add to Google Calendar" icon="📅" variant="dark" onPress={addReminder} />
      </Card>

      <Card>
        <Heading>About me</Heading>
        <Body className="mb-4 mt-1 text-sm">
          Optional. Helps your sponsor suggest things that fit your life. Shared with the AI only when you talk to it, and never with your name.
        </Body>
        {PROFILE_KEYS.map((k) => (
          <Field key={k} label={PROFILE_LABELS[k].label} value={profile[k] ?? ''} onChangeText={(v) => setProfile({ ...profile, [k]: v })} placeholder={PROFILE_LABELS[k].hint} maxLength={200} />
        ))}
        <Button label="Save" variant="dark" onPress={saveProfile} />
      </Card>

      <Card>
        <Heading>Backup & new phone</Heading>
        <Body className="mb-4 mt-1 text-sm">
          Free, always. Download a file with everything, then open it on your new phone or browser. No account needed.
        </Body>
        <Button label="Download my backup" icon="⬇️" variant="dark" onPress={backup} className="mb-2" />
        <Button label="Restore from a backup" icon="⬆️" variant="soft" onPress={restore} />
      </Card>

      <CrisisBanner compact />

      <Card>
        <Heading>Open source & privacy</Heading>
        <Body className="mt-1 text-sm">
          No accounts, no ads, no trackers. When you talk to your sponsor, only that conversation is sent to the AI, and our server keeps nothing. Read every line of code, or run your own copy.
        </Body>
        <Text onPress={() => Linking.openURL(REPO_URL)} className="mt-3 font-body-black text-amber underline">
          View the code and docs ›
        </Text>
        <Text className="mt-3 font-body text-xs text-mist">
          Not medical care. Scripture: World English Bible (public domain). License: AGPL-3.0.
        </Text>
      </Card>

      <Card>
        <Heading>Delete everything</Heading>
        <Body className="mb-3 mt-1 text-sm">
          {confirmWipe ? 'This can’t be undone. All trackers, logs, check-ins and rays will be gone. Download a backup first if you might want them.' : 'Removes all your data from this device.'}
        </Body>
        <Button label={confirmWipe ? 'Yes, delete everything' : 'Delete all my data'} variant={confirmWipe ? 'dark' : 'soft'} onPress={wipe} />
        {confirmWipe ? (
          <Text onPress={() => setConfirmWipe(0)} className="mt-3 text-center font-body-bold text-mist">
            Cancel
          </Text>
        ) : null}
      </Card>
    </Screen>
  );
}
