import { defineConfig, devices } from '@playwright/test'

import type { ManualOptions } from './e2e/manual/fixtures'

// See e2e/manual/README.md
const viewport = { width: 1360, height: 860 }
const narrationPass = process.env.MANUAL_PASS === 'narrate'
// The test, the browser and the server all run in the same time zone
process.env.TZ = 'Europe/Helsinki'

const project = (lang: ManualOptions['lang'], locale: string) => ({
  name: lang,
  use: {
    ...devices['Desktop Chrome'],
    viewport,
    lang,
    locale,
    timezoneId: 'Europe/Helsinki',
  },
})

export default defineConfig<ManualOptions>({
  testDir: 'e2e/manual/scenarios',
  testMatch: '*.manual.ts',
  outputDir: 'test-results/manual',
  // Every scenario replaces all data
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  // The narration pass waits for the voice service
  timeout: narrationPass ? 0 : 180_000,
  reporter: 'list',
  use: {
    baseURL:
      process.env.BASE_URL ??
      `http://localhost:${process.env.MANUAL_APP_PORT ?? 8010}`,
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    video: narrationPass
      ? 'off'
      : { mode: 'retain-on-failure', size: viewport },
    trace: narrationPass ? 'retain-on-failure' : 'off',
  },
  projects: [
    project('fi', 'fi-FI'),
    project('sv', 'sv-FI'),
    project('en', 'en-GB'),
  ],
})
