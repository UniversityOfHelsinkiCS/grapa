# Manual videos

Narrated videos of the programme settings in Finnish, Swedish and English, shown on the programme's page next to the settings. Scenarios are Playwright tests that seed made-up demo data (`src/server/test/manual/`).

## Running

```bash
npm run manual:setup                     # the app (port 8010) and the voice service (port 5005)
npx playwright install chromium          # once
npm run manual:record                    # every scenario in every language
npm run manual:record -- milestones      # scenarios whose file name matches
npm run manual:record -- --project=fi    # one language
npm run manual:down                      # stops the stack and removes its data
```

Videos go to `public/manual/<lang>/` (gitignored), listed in its `index.json`. `scripts/get_manual_videos.sh` pulls the newest ones recorded on master instead.

## Writing a scenario

Add `scenarios/<slug>.manual.ts`; one file is one video. It starts on its setting, says what the setting is, then shows what it does, e.g. on the thesis form or Supervised theses.

```ts
manualTest(
  'Seminaari',
  {
    annotation: [
      { type: 'en', description: 'Seminar' },
      { type: 'sv', description: 'Seminarium' },
      { type: 'setting', description: 'seminar' },
    ],
  },
  async ({ page, demo, caption, click, hover, curtain, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    await openSettings(page, t, featureLabel(page, t, 'seminar'))

    await toggleFeature(steps, 'seminar', {
      fi: 'Mitä asetus tekee.',
      sv: 'Vad inställningen gör.',
      en: 'What the setting does.',
    })
    await curtain(same(t('navbar:supervisedTheses')), () =>
      openSupervisedTheses(page, t)
    )
    const form = await openNewThesisForm(steps)
    await expect(
      form.getByTestId('seminarSupervisor-select-input-1')
    ).toBeVisible()
  }
)
```

- `setting` annotations tell which settings the video belongs next to.
- Every caption has all three languages, in the app's current terms.
- Shared steps are in `steps.ts`, the demo data and its users in `src/server/test/manual/demoData.ts`.
- End with an `expect`, so a broken scenario fails instead of recording a wrong video.

## Narration

The voice is the shared [guide-video-voice](https://github.com/UniversityOfHelsinkiCS/guide-video-voice) image; pulling it needs `docker login registry.version.helsinki.fi`. Clips are generated before recording and cached in `.narration-cache/`, so only new captions are generated again.

## CI

`.github/workflows/manual-videos.yml` records the videos on every push to master and pushes them to the registry. Staging and production builds include the newest ones. A failed video doesn't hold up the deploy.
