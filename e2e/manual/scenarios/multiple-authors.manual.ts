import { STUDENTS } from '../../../src/server/test/manual/demoData'
import { expect, manualTest } from '../fixtures'
import {
  choosePerson,
  featureLabel,
  openNewThesisForm,
  openSettings,
  openSupervisedTheses,
  same,
  toggleFeature,
} from '../steps'

manualTest(
  'Useita tekijöitä',
  {
    annotation: [
      { type: 'en', description: 'Multiple authors' },
      { type: 'sv', description: 'Flera skribenter' },
      { type: 'setting', description: 'allowMultipleAuthors' },
    ],
  },
  async ({ page, demo, caption, click, hover, fill, curtain, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    await openSettings(page, t, featureLabel(page, t, 'allowMultipleAuthors'))

    await toggleFeature(steps, 'allowMultipleAuthors', {
      fi: 'Oletuksena tutkielmalla on yksi tekijä. Jos ohjelmassa voi kirjoittaa tutkielman yhdessä, salli useita tekijöitä.',
      sv: 'Som standard har en avhandling en skribent. Om avhandlingar kan skrivas tillsammans i programmet, tillåt flera skribenter.',
      en: 'By default, a thesis has one author. If theses can be written together in the programme, allow multiple authors.',
    })

    await curtain(same(t('navbar:supervisedTheses')), () =>
      openSupervisedTheses(page, t)
    )
    const form = await openNewThesisForm(steps)
    const authors = form
      .getByTestId('author-select-input')
      .getByRole('combobox')
    await caption({
      fi: 'Tutkielmalomakkeelle voi nyt valita useita tekijöitä. Tekijät haetaan nimellä.',
      sv: 'På avhandlingsblanketten kan du nu välja flera skribenter. Skribenterna söks med namn.',
      en: 'Several authors can now be chosen on the thesis form. Authors are searched by name.',
    })
    await choosePerson(steps, fill, authors, STUDENTS[0].lastName)
    await choosePerson(steps, fill, authors, STUDENTS[1].lastName)

    const chosen = form.getByTestId(/^remove-author-button-/)
    await expect(chosen).toHaveCount(2)
    await hover(chosen.last())
    await caption({
      fi: 'Valitut tekijät näkyvät kentän alla. Jokainen tekijä näkee tutkielman omissa tutkielmissaan.',
      sv: 'De valda skribenterna visas under fältet. Varje skribent ser avhandlingen bland sina egna avhandlingar.',
      en: 'The chosen authors are shown under the field. Every author sees the thesis among their own theses.',
    })
  }
)
