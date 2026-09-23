// Set in .env as EXPO_PUBLIC_RELAY_URL. This is the URL of the relay in /relay,
// never an Anthropic API key: anything bundled into the app can be extracted.
export const RELAY_URL = process.env.EXPO_PUBLIC_RELAY_URL ?? '';
