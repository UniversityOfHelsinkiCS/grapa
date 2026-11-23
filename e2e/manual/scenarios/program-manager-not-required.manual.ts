import { expect, manualTest } from '../fixtures'
import {
  featureLabel,
  openNewThesisForm,
  openSettings,
  openSupervisedTheses,
  same,
  toggleFeature,
} from '../steps'

manualTest(
  'Vastuuhenkilö ei pakollinen',
  {
    annotation: [
      { type: 'en', description: 'Program manager not required' },
      { type: 'sv', description: 'Ansvarig person inte obligatorisk' },
      { type: 'setting', description: 'thesisProgramManagerNotRequired' },
    ],
  },
  async ({ page, demo, caption, click, hover, curtain, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    await openSettings(
      page,
      t,
      featureLabel(page, t, 'thesisProgramManagerNotRequired')
    )

    await toggleFeature(steps, 'thesisProgramManagerNotRequired', {
      fi: 'Oletuksena tutkielmalomakkeella valitaan vastuuhenkilö: ohjelman vastaava, joka hoitaa tutkielman prosessia ja näkee sen ohjatuissa tutkielmissaan. Jos ohjelma ei käytä vastuuhenkilöitä, kytke tämä päälle.',
      sv: 'Som standard väljs en ansvarig person på avhandlingsblanketten: en programansvarig som sköter avhandlingens process och ser den bland sina handledda avhandlingar. Om programmet inte använder ansvariga personer, slå på det här.',
      en: "By default, a programme manager is chosen on the thesis form to manage the thesis's process, and they see it among their supervised theses. If the programme doesn't use them, switch this on.",
    })

    await curtain(same(t('navbar:supervisedTheses')), () =>
      openSupervisedTheses(page, t)
    )
    const form = await openNewThesisForm(steps)
    await hover(form.getByTestId('program-select-input'))
    await expect(form.getByTestId('approver-select-input')).toBeHidden()
    await caption({
      fi: 'Tutkielmalomakkeelta puuttuu nyt ohjelmavastaavan valinta. Ohjelman vastaavat näkevät tutkielmat edelleen ohjelman sivulla.',
      sv: 'Avhandlingsblanketten saknar nu valet av programansvarig. De programansvariga ser fortfarande avhandlingarna på programmets sida.',
      en: "The thesis form no longer has the programme manager selection. The programme managers still see the theses on the programme's page.",
    })
  }
)
