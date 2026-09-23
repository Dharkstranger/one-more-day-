import { Platform } from 'react-native';

// Where the AI sponsor relay lives. This is never an Anthropic API key:
// anything bundled into an app can be extracted.
// - Web on Vercel: the relay is this site's own /api folder, so no setting is needed.
// - Phones (or a self-hosted relay): set EXPO_PUBLIC_RELAY_URL, e.g. https://your-site.vercel.app/api
export const RELAY_URL = process.env.EXPO_PUBLIC_RELAY_URL || (Platform.OS === 'web' ? '/api' : '');
