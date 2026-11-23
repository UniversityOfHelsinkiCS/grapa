import type { Locator, Page } from '@playwright/test'

import fs from 'node:fs/promises'
import path from 'node:path'

import { expect, test } from '../support/test'
import { createDemo, type Demo } from './demo'
import { getNarrator } from './narration'
import { encodeVideo, type PlacedClip, updateIndex } from './output'
import {
  CURTAIN_FADE_MS,
  installOverlay,
  showCaption,
  showCurtain,
} from './overlay'
import { createTranslate, type Translate } from './translate'

import type { Language } from '../../src/server/test/manual/demoData'

export type { Language }
export type Caption = Record<Language, string>

export type ManualOptions = { lang: Language }

type Recording = {
  startedAt: number
  speakingUntil: number
  // Ms from the start, null before the first caption
  firstCaptionMs: number | null
  clips: PlacedClip[]
  captions: string[]
}

type ManualFixtures = {
  demo: Demo
  // A UI label in the video's language, like t('common:save')
  t: Translate
  // Text the user types, in the video's language
  localize: (text: Caption) => string
  recording: Recording
  caption: (text: Caption, minMs?: number) => Promise<void>
  // Moves the cursor to an element without clicking
  hover: (locator: Locator) => Promise<void>
  click: (locator: Locator) => Promise<void>
  fill: (locator: Locator, text: string) => Promise<void>
  scrollTo: (locator: Locator) => Promise<void>
  pause: (ms?: number) => Promise<void>
  // Hides a change behind a titled card
  curtain: (text: Caption, change: () => Promise<void>) => Promise<void>
}

const narrationPass = process.env.MANUAL_PASS === 'narrate'
// The narration pass runs the same steps without the pacing
const pace = (ms: number) => (narrationPass ? 0 : ms)
const scrollBehavior: ScrollBehavior = narrationPass ? 'instant' : 'smooth'

// The screen changes only after the caption about it has been spoken, the cursor may point while it's spoken
const untilSpoken = (page: Page, recording: Recording) =>
  page.waitForTimeout(pace(Math.max(0, recording.speakingUntil - Date.now())))

const STEP_DELAY = 600
const TYPE_DELAY = 60
const CURSOR_MOVE_MS = 500
const CURSOR_STEPS = 18
const MIN_CAPTION_MS = 1600
const CAPTION_MS_PER_CHAR = 60
const NARRATION_GAP_MS = 600
// How far into a caption the next action starts
const CAPTION_LEAD_MS = 1000
// Kept before the first caption when trimming the start
const INTRO_MS = 500
const OUTRO_MS = 1200
const SETTLE_MS = 1500
const SCROLL_MS = 900
// Elements this close to the top or bottom are scrolled to the middle first
const SCREEN_EDGE = 0.25

// CI lists scenarios missing narration, and fails recordings without it
const missingNarration = async (file: string, text: string) => {
  const listFile = process.env.MANUAL_MISSING_FILE
  if (listFile) return fs.appendFile(listFile, `${path.basename(file)}\n`)
  if (process.env.CI) throw new Error(`No narration for: ${text}`)
  console.warn(`No narration for: ${text}`)
}

// The browser would only scroll an element just inside the screen edge
const centerOnScreen = async (page: Page, locator: Locator) => {
  await locator.waitFor()
  const box = await locator.boundingBox()
  const height = page.viewportSize()?.height
  if (!box || !height) return
  const center = box.y + box.height / 2
  if (center > height * SCREEN_EDGE && center < height * (1 - SCREEN_EDGE))
    return

  await locator.evaluate(
    (element, behavior) =>
      element.scrollIntoView({ behavior, block: 'center' }),
    scrollBehavior
  )
  // Fixed elements like the navbar never move
  let previous = box
  for (let waited = 0; waited < SCROLL_MS * 2; waited += 100) {
    await page.waitForTimeout(pace(100))
    const current = await locator.boundingBox()
    if (!current || current.y === previous.y) break
    previous = current
  }
}

const CURTAIN_MIN_MS = 2000
// Lets the viewer see what changed before the video continues
const AFTER_CURTAIN_MS = 500

const readingTime = (text: string) =>
  Math.max(MIN_CAPTION_MS, text.length * CAPTION_MS_PER_CHAR)

export const manualTest = test.extend<ManualOptions & ManualFixtures>({
  lang: ['fi', { option: true }],

  demo: async ({ request, page, lang, loginAs }, use) => {
    await use(createDemo(request, page, lang, loginAs))
  },

  t: async ({ lang }, use) => {
    await use(createTranslate(lang))
  },

  localize: async ({ lang }, use) => {
    await use((text) => text[lang])
  },

  // Fails the video if the browser requests anything outside the app, like Sentry
  page: async ({ page, baseURL }, use) => {
    const appOrigin = new URL(baseURL!).origin
    const blocked: string[] = []
    await page.route('**/*', (route) => {
      const request = route.request()
      const { origin } = new URL(request.url())
      if (origin === appOrigin) return route.continue()
      blocked.push(`${request.method()} ${request.url()}`)
      return route.abort('blockedbyclient')
    })
    await use(page)
    expect(blocked).toEqual([])
  },

  recording: [
    async ({ page, lang }, use, testInfo) => {
      await installOverlay(page)
      const recording: Recording = {
        startedAt: Date.now(),
        speakingUntil: 0,
        firstCaptionMs: null,
        clips: [],
        captions: [],
      }

      await use(recording)

      if (!narrationPass)
        await page.waitForTimeout(
          Math.max(0, recording.speakingUntil - Date.now()) + OUTRO_MS
        )
      const video = page.video()
      // Cut the blank page and loading before the first caption
      const trimMs = Math.max(0, (recording.firstCaptionMs ?? 0) - INTRO_MS)
      const durationMs = Date.now() - recording.startedAt - trimMs
      await page.close()
      if (
        narrationPass ||
        !video ||
        testInfo.status !== testInfo.expectedStatus
      )
        return

      const clips = recording.clips.map((clip) => ({
        ...clip,
        offsetMs: clip.offsetMs - trimMs,
      }))

      // Copied into the image by the build, see the Dockerfile
      const dir = path.resolve(import.meta.dirname, '../../public/manual', lang)
      const slug = path.basename(testInfo.file, '.manual.ts')
      await fs.mkdir(dir, { recursive: true })
      const webmPath = path.join(dir, `${slug}.webm`)
      await video.saveAs(webmPath)
      const videoPath = await encodeVideo(webmPath, clips, trimMs)
      await updateIndex(dir, {
        slug,
        // The title is Finnish, other languages come from annotations
        title:
          testInfo.annotations.find((annotation) => annotation.type === lang)
            ?.description ?? testInfo.title,
        settings: testInfo.annotations
          .filter((annotation) => annotation.type === 'setting')
          .map((annotation) => annotation.description!),
        url: `/manual/${lang}/${path.basename(videoPath)}`,
        durationMs,
        captions: recording.captions,
      })
      console.log(`Saved ${path.relative(process.cwd(), videoPath)}`)
    },
    { auto: true },
  ],

  caption: async ({ page, lang, recording }, use, testInfo) => {
    await use(async (caption, minMs = 0) => {
      const text = caption[lang]

      const narrator = await getNarrator()
      const clip = await narrator.narrate(text, lang)
      if (!clip && !narrator.online) await missingNarration(testInfo.file, text)
      if (narrationPass) return
      if (clip && !clip.cached)
        console.warn(
          `Narration was not pre-generated, the video freezes here: ${text}`
        )

      // Let the page render before the first caption, this wait is trimmed
      if (recording.firstCaptionMs === null) {
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(SETTLE_MS)
      }
      // The next caption waits for the previous one to finish
      await page.waitForTimeout(
        Math.max(0, recording.speakingUntil + NARRATION_GAP_MS - Date.now())
      )
      const startMs = Date.now() - recording.startedAt
      recording.firstCaptionMs ??= startMs
      recording.captions.push(text)
      if (clip) recording.clips.push({ path: clip.path, offsetMs: startMs })
      await showCaption(page, text)
      recording.speakingUntil =
        Date.now() + (clip ? clip.durationMs : readingTime(text))
      await page.waitForTimeout(Math.max(minMs, CAPTION_LEAD_MS))
    })
  },

  hover: async ({ page }, use) => {
    let cursor = { x: 0, y: 0 }

    await use(async (locator) => {
      await centerOnScreen(page, locator)
      const box = await locator.boundingBox()
      if (!box) throw new Error('Element has no bounding box, is it visible?')
      const target = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
      for (let step = 1; step <= CURSOR_STEPS; step++) {
        const progress = step / CURSOR_STEPS
        await page.mouse.move(
          cursor.x + (target.x - cursor.x) * progress,
          cursor.y + (target.y - cursor.y) * progress
        )
        await page.waitForTimeout(pace(CURSOR_MOVE_MS / CURSOR_STEPS))
      }
      cursor = target
      await page.waitForTimeout(pace(150))
    })
  },

  click: async ({ page, hover, recording }, use) => {
    await use(async (locator) => {
      await hover(locator)
      await untilSpoken(page, recording)
      await locator.click()
      await page.waitForTimeout(pace(STEP_DELAY))
    })
  },

  fill: async ({ page, click }, use) => {
    await use(async (locator, text) => {
      await click(locator)
      await locator.pressSequentially(text, { delay: pace(TYPE_DELAY) })
      await page.waitForTimeout(pace(STEP_DELAY))
    })
  },

  scrollTo: async ({ page, recording }, use) => {
    await use(async (locator) => {
      await untilSpoken(page, recording)
      await locator.evaluate(
        (element, behavior) =>
          element.scrollIntoView({ behavior, block: 'center' }),
        scrollBehavior
      )
      await page.waitForTimeout(pace(SCROLL_MS))
    })
  },

  curtain: async ({ page, lang, recording }, use) => {
    await use(async (text, change) => {
      // Let the previous caption finish first
      await page.waitForTimeout(
        pace(
          Math.max(0, recording.speakingUntil + NARRATION_GAP_MS - Date.now())
        )
      )
      await showCaption(page, '')
      const shownAt = Date.now()
      recording.captions.push(text[lang])
      await showCurtain(page, text[lang])
      await page.waitForTimeout(pace(CURTAIN_FADE_MS))
      await change()
      await page.waitForTimeout(
        pace(Math.max(STEP_DELAY, shownAt + CURTAIN_MIN_MS - Date.now()))
      )
      await showCurtain(page, null)
      await page.waitForTimeout(pace(CURTAIN_FADE_MS + AFTER_CURTAIN_MS))
    })
  },

  pause: async ({ page }, use) => {
    await use(async (ms = STEP_DELAY) => {
      if (!narrationPass) await page.waitForTimeout(ms)
    })
  },
})

export { expect } from '../support/test'
