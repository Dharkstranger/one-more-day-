import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useSQLiteContext } from 'expo-sqlite';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Screen } from '../../components/ui/Screen';
import { Body, Heading, Label, Title } from '../../components/ui/Text';
import { deleteAddiction, getAddiction } from '../../db/repo/addictions';
import { addDangerZone, deleteDangerZone, listDangerZones } from '../../db/repo/dangerZones';
import { getDetails, parseReasons, upsertDetails } from '../../db/repo/details';
import { listLogs } from '../../db/repo/logs';
import type { AddictionDetailsRow, AddictionRow, DangerZoneRow, LogRow } from '../../db/types';
import { DANGER_ZONES_SUPPORTED, requestDangerZonePermissions, syncDangerZones } from '../../services/location/geofence';
import { trackerStats, type TrackerStats } from '../../services/sunshine/engine';

const TYPE_LABEL: Record<string, string> = { slip: 'Slipped', urging_averted: 'Beat an urge', urging_failed: 'Urge, gave in' };

export default function TrackerDetail() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [a, setA] = useState<AddictionRow | null>(null);
  const [details, setDetails] = useState<AddictionDetailsRow | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [stats, setStats] = useState<TrackerStats | null>(null);
  const [zones, setZones] = useState<DangerZoneRow[]>([]);
  const [zoneLabel, setZoneLabel] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const row = await getAddiction(db, id);
    if (!row) return router.replace('/');
    const [d, l, z] = await Promise.all([getDetails(db, id), listLogs(db, id, 500), listDangerZones(db)]);
    setA(row);
    setDetails(d);
    setLogs(l);
    setZones(z.filter((x) => x.addiction_id === id));
    setStats(trackerStats({ createdAt: row.created_at, weeklyCost: d?.weekly_cost ?? 0, weeklyHours: d?.weekly_hours ?? 0 }, l));
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!a || !stats) return <Screen level={2}>{null}</Screen>;
  const observe = details?.mode === 'observe';

  const switchMode = async () => {
    await upsertDetails(db, id, {
      emoji: details?.emoji ?? undefined,
      mode: observe ? 'quit' : 'observe',
      weeklyCost: details?.weekly_cost,
      weeklyHours: details?.weekly_hours,
      reasons: parseReasons(details),
    });
    await load();
  };

  const markHere = async () => {
    if (!(await requestDangerZonePermissions())) return setMessage('Location permission is needed for this.');
    const pos = await Location.getCurrentPositionAsync({});
    await addDangerZone(db, { addictionId: id, label: zoneLabel.trim() || 'a risky place', latitude: pos.coords.latitude, longitude: pos.coords.longitude, radiusMeters: 150 });
    await syncDangerZones(await listDangerZones(db));
    setZoneLabel('');
    setMessage('Saved. We’ll check on you when you get close.');
    await load();
  };

  return (
    <Screen level={3}>
      <Text onPress={() => router.back()} className="mb-2 font-body-bold text-white/80">
        ‹ Back
      </Text>
      <Title light>
        {details?.emoji ?? '✨'} {a.name}
      </Title>
      <Body light className="mb-5 mt-1">
        Started {new Date(a.created_at).toLocaleDateString()} · {observe ? 'watching the pattern' : 'working to stop'}
      </Body>

      <Card>
        <View className="flex-row flex-wrap">
          <Stat label="days free now" value={String(stats.streakDays)} />
          <Stat label="best run" value={`${stats.longestStreakDays}d`} />
          <Stat label="clean days total" value={String(stats.cleanDaysTotal)} />
          <Stat label="money back" value={stats.moneySaved.toFixed(0)} />
        </View>
      </Card>

      {parseReasons(details).length ? (
        <Card>
          <Label>Why you’re doing this</Label>
          {parseReasons(details).map((r) => (
            <Text key={r} className="mt-2 font-display text-lg text-ink">
              • {r}
            </Text>
          ))}
        </Card>
      ) : null}

      <Card>
        <Heading className="mb-2">History</Heading>
        {logs.length === 0 ? <Body className="text-sm">Nothing logged yet.</Body> : null}
        {logs.slice(0, 30).map((l) => (
          <View key={l.id} className="border-b border-ink/5 py-2">
            <View className="flex-row justify-between">
              <Text className="font-body-bold text-ink">{TYPE_LABEL[l.log_type]}</Text>
              <Text className="font-body text-xs text-mist">{new Date(l.timestamp).toLocaleString()}</Text>
            </View>
            {l.trigger_emotion ? <Text className="font-body text-sm text-mist">Feeling: {l.trigger_emotion}</Text> : null}
            {l.ai_response_summary ? <Text className="mt-1 font-body text-sm text-ink/80">💬 {l.ai_response_summary}</Text> : null}
          </View>
        ))}
      </Card>

      <Card>
        <Heading className="mb-2">Risky places</Heading>
        {DANGER_ZONES_SUPPORTED ? (
          <>
            <Body className="mb-3 text-sm">Standing somewhere that’s hard for you? Save it. Your phone will check on you when you come near. Locations never leave your phone.</Body>
            {zones.map((z) => (
              <View key={z.id} className="flex-row items-center justify-between py-1">
                <Text className="font-body text-ink">📍 {z.label}</Text>
                <Text
                  onPress={async () => {
                    await deleteDangerZone(db, z.id);
                    await syncDangerZones(await listDangerZones(db));
                    await load();
                  }}
                  className="font-body-bold text-mist"
                >
                  Remove
                </Text>
              </View>
            ))}
            <Field label="Name this place" value={zoneLabel} onChangeText={setZoneLabel} placeholder="e.g. the corner shop" maxLength={40} />
            <Button label="Mark where I am now" variant="dark" onPress={markHere} />
          </>
        ) : (
          <Body className="text-sm">This works in the phone app. Browsers can’t watch your location in the background (and we’d rather they didn’t).</Body>
        )}
        {message ? <Text className="mt-2 font-body-bold text-sage">{message}</Text> : null}
      </Card>

      <Button label={observe ? 'I’m ready to try stopping' : 'Switch to just watching'} variant="ghost" onPress={switchMode} className="mb-3" />
      {confirmDelete ? (
        <Card>
          <Body>This deletes this tracker and all its history from this device. Your rays stay. Are you sure?</Body>
          <View className="mt-3 flex-row gap-2">
            <Button
              className="flex-1"
              variant="dark"
              label="Delete"
              onPress={async () => {
                await deleteAddiction(db, id);
                router.replace('/');
              }}
            />
            <Button className="flex-1" variant="soft" label="Keep it" onPress={() => setConfirmDelete(false)} />
          </View>
        </Card>
      ) : (
        <Text onPress={() => setConfirmDelete(true)} className="mt-2 text-center font-body-bold text-white/70">
          Delete this tracker
        </Text>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3 w-1/2">
      <Text className="font-display-bold text-3xl text-ink">{value}</Text>
      <Text className="font-body-semi text-xs text-mist">{label}</Text>
    </View>
  );
}
