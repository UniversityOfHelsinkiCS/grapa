import { THESES } from '../../../src/server/test/manual/demoData'
import { expect, manualTest } from '../fixtures'
import {
  featureLabel,
  openSettings,
  openSupervisedTheses,
  openThesis,
  same,
  toggleFeature,
} from '../steps'

// Supervised by the narrator, hasn't progressed in over a year
const THESIS = THESES.find((thesis) => thesis.isIdle)!

manualTest(
  'Lepotila',
  {
    annotation: [
      { type: 'en', description: 'Idle state' },
      { type: 'sv', description: 'Viloläge' },
      { type: 'setting', description: 'useIdleState' },
    ],
  },
  async ({ page, demo, caption, click, hover, curtain, lang, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    await openSettings(page, t, featureLabel(page, t, 'useIdleState'))

    await toggleFeature(steps, 'useIdleState', {
      fi: 'Lepotilan seuranta merkitsee tutkielman lepotilaan, jos se ei ole edennyt puoleen vuoteen kandiohjelmassa tai vuoteen maisteriohjelmassa.',
      sv: 'Vilolägesuppföljningen markerar en avhandling som vilande om den inte har gått framåt på ett halvår i kandidat- eller ett år i magisterprogrammet.',
      en: "Idle state tracking marks a thesis as idle if it hasn't progressed in half a year in a Bachelor's or a year in a Master's programme.",
    })

    await curtain(same(t('navbar:supervisedTheses')), () =>
      openSupervisedTheses(page, t)
    )
    const row = page.getByRole('row').filter({ hasText: THESIS.topic[lang] })
    await expect(row).toContainText(t('thesisStages:idle'))
    await hover(row.getByText(t('thesisStages:idle')).first())
    await caption({
      fi: 'Lepotilassa oleva tutkielma näkyy listassa himmennettynä ja kuun kuvakkeella, ja sen tilan perässä lukee Lepotilassa.',
      sv: 'En vilande avhandling visas nedtonad i listan med en månikon, och efter dess status står Vilande.',
      en: 'An idle thesis is dimmed in the list with a moon icon, and its status is followed by Idle.',
    })

    const thesis = await openThesis(steps, THESIS.topic[lang])
    const wakeUp = thesis.getByRole('button', {
      name: t('viewThesisFooter:wakeUpFromSleepButton'),
    })
    await hover(wakeUp)
    await caption({
      fi: 'Kun työ taas jatkuu, tutkielman voi herättää. Myös etapin tai tilan muutos herättää sen.',
      sv: 'När arbetet fortsätter kan avhandlingen väckas. Den väcks också när milstolpen eller statusen ändras.',
      en: 'When the work goes on again, the thesis can be woken up. A change of milestone or status also wakes it up.',
    })
    await click(wakeUp)
    const confirmWakeUp = page.getByRole('dialog', {
      name: t('viewThesisFooter:wakeUpFromSleepButtonConfirmTitle'),
    })
    await click(
      confirmWakeUp.getByRole('button', {
        name: t('approveButton'),
        exact: true,
      })
    )
    await expect(confirmWakeUp).toBeHidden()
    await expect(
      thesis.getByText(t('viewThesisFooter:thesisIdle'))
    ).toBeHidden()
    await expect(row).not.toContainText(t('thesisStages:idle'))
    await hover(row)
    await caption({
      fi: 'Herätetty tutkielma on taas tavallinen käynnissä oleva tutkielma.',
      sv: 'Den väckta avhandlingen är igen en vanlig pågående avhandling.',
      en: 'The thesis that was woken up is an ordinary thesis in progress again.',
    })
  }
)
