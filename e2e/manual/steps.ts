import type { Locator, Page } from '@playwright/test'

import type { Caption } from './fixtures'
import type { Translate } from './translate'

import { MASTER_PROGRAM } from '../../src/server/test/manual/demoData'
import { expect } from '../support/test'

type Act = (locator: Locator) => Promise<void>
type Narrate = (caption: Caption) => Promise<void>

export type StepFixtures = {
  page: Page
  click: Act
  hover: Act
  caption: Narrate
  t: Translate
}

// The same text in every language, like a label of the app already translated with t
export const same = (text: string): Caption => ({
  fi: text,
  sv: text,
  en: text,
})

// A feature's switch, found by its label since the tooltip is its accessible name
export const featureSwitch = (page: Page, t: Translate, feature: string) =>
  page
    .locator('label')
    .filter({ has: featureLabel(page, t, feature) })
    .getByRole('switch')

// The label of the switch, hovering it shows what the feature does
export const featureLabel = (page: Page, t: Translate, feature: string) =>
  page.getByText(t(`programOverviewPage:${feature}:toggle`), { exact: true })

// The innermost element with both the heading and the content, since sections share button labels
export const sectionOf = (page: Page, title: string, content: Locator) =>
  page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
    .filter({ has: content })
    .last()

// Opens the Configurations tab at a setting, before the first caption or behind a curtain
export const openSettings = async (
  page: Page,
  t: Translate,
  at?: Locator,
  programId = MASTER_PROGRAM.id
) => {
  await page.goto(`/programs/${programId}`)
  await page
    .getByRole('tab', { name: t('programOverviewPage:configurationsTab') })
    .click()
  await page.getByTestId('acknowledge-configurations-warning').click()
  if (at)
    await at.evaluate((element) =>
      element.scrollIntoView({ behavior: 'instant', block: 'center' })
    )
}

// Every change in the Configurations tab is saved only after it's confirmed
export const confirm = async (
  { page, click, t }: StepFixtures,
  button = 'submitButton'
) => {
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await click(dialog.getByRole('button', { name: t(button), exact: true }))
  await expect(dialog).toBeHidden()
}

// Toggles a feature and confirms it
export const toggleFeature = async (
  fixtures: StepFixtures,
  feature: string,
  caption?: Caption
) => {
  const { page, click, hover, t } = fixtures
  await hover(featureLabel(page, t, feature))
  if (caption) await fixtures.caption(caption)
  const control = featureSwitch(page, t, feature)
  const wasOn = await control.isChecked()
  await click(control)
  await confirm(fixtures)
  await expect(control).toBeChecked({ checked: !wasOn })
}

// The thesis form as a student sees it, opened from the helper texts of the Configurations tab
export const openFormPreview = async ({ page, click, t }: StepFixtures) => {
  await click(page.getByTestId('generalHelperText-preview-button'))
  const preview = page.getByRole('dialog', {
    name: t('programOverviewPage:helperTextsPreviewFormTitle'),
  })
  await expect(preview).toBeVisible()
  return preview
}

export const closeDialog = async ({ click }: StepFixtures, dialog: Locator) => {
  await click(dialog.getByTestId('popup-cancel-button'))
  await expect(dialog).toBeHidden()
}

// Behind a curtain: the narrator's own theses, the ones they supervise or approve
export const openSupervisedTheses = async (page: Page, t: Translate) => {
  await page.goto('/supervised-theses')
  await expect(
    page.getByRole('button', {
      name: t('thesesTableToolbar:newThesisButton'),
    })
  ).toBeVisible()
}

// Opens a thesis of the list below it, like clicking its row
export const openThesis = async (
  { page, click, t }: StepFixtures,
  topic: string
) => {
  await click(
    page.getByRole('button', {
      name: `${topic}, ${t('thesesPage:showThesisPreview')}`,
    })
  )
  const preview = page.getByRole('region', { name: t('thesisPreview') })
  await expect(preview.getByText(topic).first()).toBeVisible()
  return preview
}

// The new thesis form of a staff member, in the master's programme the settings were changed in
export const openNewThesisForm = async ({ page, click, t }: StepFixtures) => {
  await click(
    page.getByRole('button', {
      name: t('thesesTableToolbar:newThesisButton'),
    })
  )
  const form = page.getByRole('dialog', {
    name: t('thesisForm:newThesisFormTitle'),
  })
  await expect(form).toBeVisible()
  await click(form.getByTestId('program-select-input'))
  await click(page.getByTestId(`program-select-item-${MASTER_PROGRAM.id}`))
  return form
}

// Chooses a person in a search field, the search needs five characters
export const choosePerson = async (
  { page, click }: StepFixtures,
  fill: (locator: Locator, text: string) => Promise<void>,
  field: Locator,
  search: string
) => {
  await fill(field, search)
  await click(page.getByRole('option', { name: new RegExp(search) }).first())
}

// A minimal valid PDF
export const pdf = (name: string) => ({
  name,
  mimeType: 'application/pdf',
  buffer: Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'
  ),
})

// Picks the file without showing the file picker
export const upload = async (
  { page, click }: StepFixtures,
  button: Locator,
  file: ReturnType<typeof pdf>
) => {
  const chooser = page.waitForEvent('filechooser')
  await click(button)
  await (await chooser).setFiles(file)
}
