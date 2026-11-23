import { test as base, expect } from '@playwright/test'

import type { Language } from '../../src/server/test/manual/demoData'

// Same as in src/config.ts, which can't be imported here as it reads Vite's env
const E2E_USER_LOCAL_STORAGE_KEY = 'grapa-e2e-user'
const SELECTED_LANGUAGE_STORAGE_KEY = 'grapa-admin-selected-language'

type Fixtures = {
  // Acts as a seeded user, in the given UI language, from the next page load on
  loginAs: (userId: string, lang: Language) => Promise<void>
}

export const test = base.extend<Fixtures>({
  // Fails on uncaught app errors
  page: async ({ page }, use) => {
    const errors: Error[] = []
    page.on('pageerror', (error) => errors.push(error))
    await use(page)
    expect(errors).toEqual([])
  },

  loginAs: async ({ page }, use) => {
    let loginCount = 0
    await use(async (userId, lang) => {
      // Set before the app boots, once per login, so the app can still change them later
      loginCount += 1
      await page.addInitScript(
        ({ userId, lang, seq, userKey, languageKey }) => {
          if (Number(sessionStorage.getItem('e2eLoginSeq') ?? 0) >= seq) return
          sessionStorage.setItem('e2eLoginSeq', String(seq))
          localStorage.setItem(userKey, userId)
          localStorage.setItem(languageKey, lang)
        },
        {
          userId,
          lang,
          seq: loginCount,
          userKey: E2E_USER_LOCAL_STORAGE_KEY,
          languageKey: SELECTED_LANGUAGE_STORAGE_KEY,
        }
      )
      await page.goto('/')
    })
  },
})

export { expect }
