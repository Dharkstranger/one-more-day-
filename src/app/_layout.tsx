import '../../global.css';
// Registers the background danger-zone task on phones (no-op file on web).
import '../services/location/geofence';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { DATABASE_NAME, migrateDbIfNeeded } from '../db';

function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: '#141A3D', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#FFD166" />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  if (!fontsLoaded) return <Loading />;

  return (
    <SafeAreaProvider>
      <Suspense fallback={<Loading />}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded} useSuspense>
          <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#141A3D' } }} />
        </SQLiteProvider>
      </Suspense>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
