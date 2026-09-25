# Run your own copy

Everything One More Day does, you can run yourself. There are no hidden services.

## 1. Deploy the web app to Vercel (about 5 minutes)

**One click:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDharkstranger%2Fone-more-day-&project-name=one-more-day&env=ANTHROPIC_API_KEY&envDescription=Anthropic%20API%20key%20for%20the%20AI%20sponsor%20(optional%3B%20the%20app%20works%20without%20it))

**Or by hand:**

1. Go to https://vercel.com/new and import the GitHub repository.
2. Leave the framework as "Other". `vercel.json` already sets the build (`npm run build:web`), the output folder (`dist`), and the security headers.
3. Add an environment variable `ANTHROPIC_API_KEY` (from https://console.anthropic.com). Without it, the app still works, and the sponsor gives offline replies with a verse.
4. Deploy. Open `https://<your-site>/api/health`. It should say `"sponsor": true` when the key is set.

Optional settings:

| Variable | Default | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | (none) | Turns on the AI sponsor. Set it in Vercel, never in the app. |
| `SPONSOR_MODEL` | `claude-opus-5` | Claude model for the sponsor. Check current prices at https://www.anthropic.com/pricing before changing. |
| `SCRIPTURE_MODEL` | `claude-sonnet-5` | Claude model for the Scripture Guide agent. |
| `RATE_LIMIT_PER_MINUTE` | `20` | AI requests per IP per minute, per endpoint, per server instance. |

The Scripture Guide function reads `data/bible/*.json` (about 17 MB). `vercel.json` includes these files with the function; other hosts must deploy the `data/` folder next to `server/`, or set `BIBLE_DATA_DIR`.

### Why the special headers?

The browser version stores data in SQLite compiled to WebAssembly, which needs `SharedArrayBuffer`. Browsers only allow that on "cross-origin isolated" pages, so `vercel.json` sends `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. If you host elsewhere, send the same two headers, or the app will not load its database.

## 2. Run the relay somewhere else

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm run relay      # http://localhost:8787/api/sponsor
```

`server/sponsor.ts` exports `handleSponsorRequest(request: Request): Promise<Response>`, so it also runs on Cloudflare Workers, Deno or Bun with a small wrapper. Point phone builds at it with `EXPO_PUBLIC_RELAY_URL=https://your-host/api`.

## 3. Build the phone apps

Phones need a development or store build (not Expo Go), because of background location.

```bash
npm install
cp .env.example .env                 # set EXPO_PUBLIC_RELAY_URL to your deployed /api
npx expo run:ios                     # or run:android, needs Xcode / Android Studio
# or build in the cloud:
npx eas-cli@latest build --profile development
```

## 4. Develop locally

```bash
npm install
npx expo start --web     # browser
npm run typecheck
npm test
```
