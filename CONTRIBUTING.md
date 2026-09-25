# Contributing

Thank you. People fighting addiction will use what you build, so kindness and care come first.

## Before you start

- Read [docs/safety.md](docs/safety.md). Changes that weaken it won't be merged.
- Read [docs/privacy.md](docs/privacy.md). No analytics, trackers, ads, or accounts.
- For anything bigger than a small fix, open an issue first to talk it through.

## Set up

```bash
npm install
npx expo start --web
```

## Before opening a pull request

```bash
npm run typecheck
npm test
npm run build:web
```

- Put rules in pure functions under `src/services/` and add tests in `test/`.
- Plain, kind words in the interface. No jargon, no shame. All text lives in `src/copy/en.ts`; follow `.agents/product-marketing.md`.
- Bible verses only through `scripts/build-scripture-seed.mjs`.
- Cite a source for any health claim or helpline number.

## License

By contributing, you agree your work is released under the [AGPL-3.0-or-later](LICENSE) license.

## Code of conduct

Be kind. Assume good faith. Many contributors are in recovery themselves; never share anyone's story without permission. Harassment gets you removed.
