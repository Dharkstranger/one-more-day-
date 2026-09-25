# Competitive analysis

Researched September 2026. Every claim links to a source you can check. Ratings and prices change often, so re-check before quoting.

## Apps reviewed

| App | Focus | Price | Source |
|---|---|---|---|
| I Am Sober | Any addiction, sobriety counter, community | Free; Plus $9.99/month or $39.99/year | [Choosing Therapy review](https://www.choosingtherapy.com/i-am-sober-app-review/) |
| Nomo | Unlimited "clocks", accountability partners | Free with optional extras | [App Store](https://apps.apple.com/us/app/nomo-sobriety-clocks/id566975787) |
| Quitzilla | Habit tracker with money saved and trophies | Free for 2 habits, premium for more | [Google Play](https://play.google.com/store/apps/details?id=com.despdev.quitzilla&hl=en_US) |
| Reframe | Cutting back on alcohol, coaching | $99.99/year after a 7-day trial | [Choosing Therapy review](https://www.choosingtherapy.com/reframe-app-review/) |
| Quittr | Porn addiction, panic button, community | Paid only ($12.99 mentioned in reviews) | [JustUseApp reviews](https://justuseapp.com/en/app/6532588521/quittr-quit-porn-now/reviews) |
| Sober Grid | Peer network, "Burning Desire" button, peer coaches | Free, paid coaching | [Wikipedia](https://en.wikipedia.org/wiki/Sober_Grid) |
| Faitheal | Christian recovery: verses, prayer, panic button | Free with purchases | [Google Play](https://play.google.com/store/apps/details?id=bzn.christian.addiction.recovery&hl=en_US) |

## Features almost everyone has (our baseline)

| Feature | In One More Day |
|---|---|
| Sobriety counter | ✅ Days free, calculated from the log history |
| Several addictions at once | ✅ Unlimited, free |
| Money saved / time reclaimed | ✅ Money and hours won back |
| Milestones / badges / chips | ✅ Milestone ladder 1, 3, 7, 14, 21, 30… days, plus Sunshine levels |
| Reasons for quitting | ✅ Up to 3, shown during urges |
| Daily motivation | ✅ Verse of the day, check-in encouragement |
| Journal / check-in | ✅ Daily mood as weather, gratitude line, private note |
| Panic button | ✅ "I'm struggling" → breathing → ideas → sponsor |
| Distraction exercises | ✅ Breathing circle, coping ideas personalised by hobbies |
| Statistics | ✅ Best run, clean days total, patterns by day and time |
| PIN lock | ⏳ Planned (phones use device lock today) |
| Community / partners | ⏳ Designed, not built. See [community-design.md](community-design.md) |

## What users complain about, and our answer

| Complaint | Evidence | Our answer |
|---|---|---|
| Progress lost on a new phone because backup is paid | I Am Sober ([Choosing Therapy](https://www.choosingtherapy.com/i-am-sober-app-review/)) | Free backup file. No account. |
| Core features paywalled | I Am Sober, Quitzilla's 2-habit limit, Quittr fully paid, Reframe $99.99/yr | Everything free and unlimited. AGPL license keeps it that way. |
| Charged after cancelling; unclear pricing | Reframe ([Trustpilot](https://www.trustpilot.com/review/reframeapp.com)) | No payments. |
| Health data shared with advertisers | Tempest/Monument via Meta Pixel ([Popular Science](https://www.popsci.com/technology/tempest-momentum-data-privacy/)); 10 opioid apps sharing data ([TechCrunch](https://techcrunch.com/2021/07/07/opioid-addiction-treatment-apps-found-sharing-sensitive-data-with-third-parties/)) | No accounts, no trackers, no ads. Data stays on the device. See [privacy.md](privacy.md). |
| Day count off by one | I Am Sober ([Choosing Therapy](https://www.choosingtherapy.com/i-am-sober-app-review/)) | Count derived from timestamps, covered by unit tests. |
| Cluttered after updates | I Am Sober | One main action per screen. |
| Want porn sites blocked | Quittr reviews | A website can't block other sites. We point to device-level blockers (see [extending.md](extending.md#ideas-we-have-not-built)). |

## What the research suggests about design

- **Counting alone isn't enough.** A study of Sober Grid users found that more check-ins went with *shorter* sobriety and more relapses, and that social connection mattered ([Recovery Answers](https://www.recoveryanswers.org/research-post/substance-use-disorder-app-who-uses-who-benefits/)). So our check-ins lead into action (breathing, ideas, talking), and the community feature is the next priority.
- **Apps are a supplement, not treatment.** The same source and others say this plainly. We show helplines in every hard moment and never claim to be treatment.
- **Faith-based support can help some people stay in recovery.** Faith-based treatment centres cite the *Journal of Religion and Health* ([Faith in Recovery](https://faith.banyantreatmentcenter.com/2020/03/17/best-christian-apps-for-addiction-recovery/)). That source is a treatment provider, so read the original study before relying on it.

## Our differences

1. **Light that never goes out.** Lifetime rays survive slips. Competitors reset everything to zero.
2. **Honesty is rewarded.** Logging a slip earns rays.
3. **Observe mode** for people who aren't sure they have a problem.
4. **AI sponsor that can't misquote scripture.** It may only use verses the app sends.
5. **Earned break time framed as strength**, with a tolerance/overdose warning for substances.
6. **Pattern warnings before hard times**, from the person's own history.
7. **Open source, AGPL.** Anyone can check it, run it, or build on it.
