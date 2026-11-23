import { expect, manualTest } from '../fixtures'
import { confirm, openSettings, sectionOf } from '../steps'

const HELPER_TEXT = {
  fi: 'Sovi aiheesta ohjaajasi kanssa ennen lomakkeen täyttämistä.',
  sv: 'Kom överens om ämnet med din handledare innan du fyller i blanketten.',
  en: 'Agree on the topic with your supervisor before filling in the form.',
}

manualTest(
  'Ohjetekstit',
  {
    annotation: [
      { type: 'en', description: 'Helper texts' },
      { type: 'sv', description: 'Hjälptexter' },
      { type: 'setting', description: 'generalHelperText' },
      { type: 'setting', description: 'supervisorHelperText' },
      { type: 'setting', description: 'seminarSupervisorHelperText' },
      { type: 'setting', description: 'topicDescriptionHelperText' },
    ],
  },
  async ({ page, demo, caption, click, hover, fill, lang, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    const general = sectionOf(
      page,
      t('programOverviewPage:generalHelperText:title'),
      page.getByRole('textbox')
    )
    await openSettings(page, t, general)

    await caption({
      fi: 'Ohjeteksteillä kerrot ohjelman omat käytännöt suoraan tutkielmalomakkeella.',
      sv: 'Med hjälptexter berättar du om programmets egna rutiner direkt på avhandlingsblanketten.',
      en: "Helper texts tell the programme's own practices right on the thesis form.",
    })
    await caption({
      fi: 'Jokaisen ohjeen kuvaus kertoo, missä kohtaa lomaketta se näytetään.',
      sv: 'Beskrivningen av varje anvisning berättar var på blanketten den visas.',
      en: 'The description of each text tells where on the form it is shown.',
    })
    await hover(
      general.getByText(t('programOverviewPage:generalHelperText:description'))
    )
    await caption({
      fi: 'Kirjoita ohje kaikilla kolmella kielellä, niin jokainen näkee sen omalla kielellään.',
      sv: 'Skriv anvisningen på alla tre språk, så ser alla den på sitt eget språk.',
      en: 'Write the text in all three languages, so everyone sees it in their own.',
    })
    for (const textLang of ['fi', 'sv', 'en'] as const) {
      await fill(
        general.getByRole('textbox', {
          name: textLang.toUpperCase(),
          exact: true,
        }),
        HELPER_TEXT[textLang]
      )
    }
    await click(
      general.getByRole('button', { name: t('common:saveButton'), exact: true })
    )
    await confirm(steps)

    await caption({
      fi: 'Esikatselu näyttää lomakkeen niin kuin opiskelija sen näkee.',
      sv: 'Förhandsgranskningen visar blanketten så som studenten ser den.',
      en: 'The preview shows the form as a student sees it.',
    })
    await click(page.getByTestId('generalHelperText-preview-button'))
    const preview = page.getByRole('dialog')
    await expect(preview.getByText(HELPER_TEXT[lang])).toBeVisible()
    await hover(preview.getByText(HELPER_TEXT[lang]))
    await caption({
      fi: 'Ohje näkyy nyt lomakkeella.',
      sv: 'Anvisningen visas nu på blanketten.',
      en: 'The instructions are now shown on the form.',
    })
  }
)
