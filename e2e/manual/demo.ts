import type { APIRequestContext, Page } from '@playwright/test'

import {
  type Language,
  MANAGER,
  NOW,
} from '../../src/server/test/manual/demoData'

// Browser version of setClock in src/server/test/manual/clock.ts
const useClock = ({ now, at }: { now: number; at: number }) => {
  const RealDate: DateConstructor = (window as any).realDate ?? Date
  ;(window as any).realDate = RealDate
  const shiftedNow = () => RealDate.now() + now - at

  window.Date = new Proxy(RealDate, {
    construct: (target, args) =>
      args.length === 0
        ? new target(shiftedNow())
        : new (target as any)(...args),
    apply: () => new RealDate(shiftedNow()).toString(),
    get: (target, prop) =>
      prop === 'now' ? shiftedNow : Reflect.get(target, prop),
  })
}

type LoginAs = (userId: string, lang: Language) => Promise<void>

export const createDemo = (
  request: APIRequestContext,
  page: Page,
  lang: Language,
  loginAs: LoginAs
) => ({
  // Replaces all data and runs the server and browser clocks from NOW
  seed: async () => {
    await page.addInitScript(useClock, {
      now: new Date(NOW).getTime(),
      at: Date.now(),
    })
    await request.post('/api/test/seed-manual', {
      data: { lang },
      timeout: 60_000,
      failOnStatusCode: true,
    })
  },

  loginAsManager: () => loginAs(MANAGER.id, lang),

  loginAs: (user: { id: string }) => loginAs(user.id, lang),
})

export type Demo = ReturnType<typeof createDemo>
