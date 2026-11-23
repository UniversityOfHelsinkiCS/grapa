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

// Supervised by the narrator, every milestone is done
const THESIS = THESES[3]

manualTest(
  'E-thesikseen lähettäminen',
  {
    annotation: [
      { type: 'en', description: 'Submitting to E-thesis' },
      { type: 'sv', description: 'Skicka till E-thesis' },
      { type: 'setting', description: 'hideSendToEthesis' },
    ],
  },
  async ({ page, demo, caption, click, hover, curtain, lang, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    const setting = featureLabel(page, t, 'hideSendToEthesis')
    await openSettings(page, t, setting)

    await hover(setting)
    await caption({
      fi: 'Tällä asetuksella piilotetaan tutkielmasta E-thesikseen lähettäminen. Oletuksena ohjaaja merkitsee tutkielman Prethesiksessä valmiiksi, ja E-thesis-vastaava kirjaa sen E-thesikseen.',
      sv: 'Med den här inställningen döljs sändningen till E-thesis i avhandlingen. Som standard markerar handledaren en färdig avhandling som klar i Prethesis, och E-thesis-ansvariga registrerar den i E-thesis.',
      en: 'This setting hides submitting to E-thesis from the thesis. By default, the supervisor marks a finished thesis as ready in Prethesis, and an E-thesis coordinator registers it in E-thesis.',
    })

    await curtain(same(t('navbar:supervisedTheses')), () =>
      openSupervisedTheses(page, t)
    )
    let thesis = await openThesis(steps, THESIS.topic[lang])
    const markReady = () =>
      thesis.getByRole('button', { name: t('thesisForm:setSentToEthesis') })
    const coordinatorStep = () =>
      thesis.locator('li').filter({ hasText: t('thesisStages:ethesisSent') })
    await hover(markReady())
    await caption({
      fi: 'Kun viimeinen etappi on tehty, ohjaaja merkitsee tutkielman valmiiksi E-thesikseen kirjaamista varten.',
      sv: 'När den sista milstolpen är klar markerar handledaren avhandlingen som klar för registrering i E-thesis.',
      en: 'When the last milestone is done, the supervisor marks the thesis as ready for E-thesis registration.',
    })
    await hover(coordinatorStep())
    await caption({
      fi: 'Sen jälkeen tutkielma on E-thesis-vastaavan käsittelyssä.',
      sv: 'Därefter behandlas avhandlingen av E-thesis-ansvariga.',
      en: 'After that, an E-thesis coordinator processes the thesis.',
    })

    await curtain(same(t('programOverviewPage:configurationsTab')), () =>
      openSettings(page, t, setting)
    )
    await toggleFeature(steps, 'hideSendToEthesis', {
      fi: 'Jos ohjelma ei kirjaa tutkielmia E-thesikseen Prethesiksen kautta, piilota toiminto.',
      sv: 'Om programmet inte registrerar avhandlingar i E-thesis via Prethesis, dölj funktionen.',
      en: "If the programme doesn't register theses in E-thesis through Prethesis, hide the function.",
    })

    await curtain(same(t('navbar:supervisedTheses')), () =>
      openSupervisedTheses(page, t)
    )
    thesis = await openThesis(steps, THESIS.topic[lang])
    await expect(markReady()).toBeHidden()
    await expect(coordinatorStep()).toHaveCount(0)
    await hover(thesis.locator('li[aria-current="step"]'))
    await caption({
      fi: 'Tutkielmassa ei enää ole painiketta eikä E-thesis-vastaavan vaihetta.',
      sv: 'Avhandlingen har inte längre knappen eller steget för E-thesis-ansvariga.',
      en: 'The thesis no longer has the button or the E-thesis coordinator step.',
    })
  }
)
