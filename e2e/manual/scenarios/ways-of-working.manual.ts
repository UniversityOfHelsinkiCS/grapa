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
  'Työskentelysopimus',
  {
    annotation: [
      { type: 'en', description: 'Ways of working agreement' },
      { type: 'sv', description: 'Överenskommelse om arbetssätt' },
      { type: 'setting', description: 'waysOfWorkingRequired' },
    ],
  },
  async ({ page, demo, caption, click, hover, curtain, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    await openSettings(page, t, featureLabel(page, t, 'waysOfWorkingRequired'))

    await toggleFeature(steps, 'waysOfWorkingRequired', {
      fi: 'Työskentelysopimuksessa opiskelija ja ohjaaja sopivat ohjauksen käytännöistä. Ohjelma voi vaatia sen jokaiselta tutkielmalta.',
      sv: 'I överenskommelsen om arbetssätt kommer studenten och handledaren överens om handledningen. Programmet kan kräva den av varje avhandling.',
      en: 'In a ways of working agreement, the student and the supervisor agree on how the supervision works. The programme can require one for every thesis.',
    })

    await curtain(same(t('navbar:supervisedTheses')), () =>
      openSupervisedTheses(page, t)
    )
    const form = await openNewThesisForm(steps)
    await hover(form.locator('#waysOfWorking'))
    await caption({
      fi: 'Tutkielmalomakkeella sopimus on nyt pakollinen liite, ja sille kysytään voimassaolopäivä.',
      sv: 'På avhandlingsblanketten är överenskommelsen nu en obligatorisk bilaga, och den får ett datum till vilket den gäller.',
      en: 'On the thesis form, the agreement is now a required appendix, with a date until which it is valid.',
    })
    const validUntil = form.getByRole('group', {
      name: t('thesisForm:waysOfWorkingValidUntil'),
    })
    await hover(validUntil)

    await click(form.getByTestId('submit-button'))
    const missing = form.getByTestId('errorsummary-waysOfWorking')
    await expect(missing).toBeVisible()
    await hover(missing)
    await caption({
      fi: 'Ilman sopimusta tutkielmaa ei voi tallentaa.',
      sv: 'Utan överenskommelsen kan avhandlingen inte sparas.',
      en: "Without the agreement, the thesis can't be saved.",
    })
  }
)
