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

// Supervised by the narrator
const THESIS = THESES[0]

manualTest(
  'Tapahtumaloki',
  {
    annotation: [
      { type: 'en', description: 'Event log' },
      { type: 'sv', description: 'Händelselogg' },
      { type: 'setting', description: 'showEventLogs' },
    ],
  },
  async ({ page, demo, caption, click, hover, curtain, lang, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    await openSettings(page, t, featureLabel(page, t, 'showEventLogs'))

    await toggleFeature(steps, 'showEventLogs', {
      fi: 'Kun tapahtumalokit näytetään, henkilökunta näkee tutkielman tiedoista, kuka on muuttanut tutkielmaa ja milloin. Opiskelijoille lokia ei näytetä.',
      sv: 'När händelseloggarna visas ser personalen i avhandlingens uppgifter vem som har ändrat den och när. Studerande ser inte loggen.',
      en: "With event logs shown, staff see in the details of a thesis who has changed it and when. Students don't see the log.",
    })

    await curtain(same(t('navbar:supervisedTheses')), () =>
      openSupervisedTheses(page, t)
    )
    const thesis = await openThesis(steps, THESIS.topic[lang])
    const log = thesis.getByRole('button', { name: t('eventLog:title') })
    await hover(log)
    await caption({
      fi: 'Tutkielman tietojen lopussa on nyt Tapahtumaloki. Se avautuu klikkaamalla.',
      sv: 'I slutet av avhandlingens uppgifter finns nu en Händelselogg. Den öppnas med ett klick.',
      en: 'The details of the thesis now end with an Event log. It opens with a click.',
    })
    await click(log)
    const created = thesis.getByText(t('eventLog:thesisCreated')).first()
    await expect(created).toBeVisible()
    await hover(created)
    await caption({
      fi: 'Lokista näet esimerkiksi, milloin tutkielma luotiin ja milloin sen tila tai etappi muuttui.',
      sv: 'I loggen ser du till exempel när avhandlingen skapades och när dess status eller milstolpe ändrades.',
      en: 'The log shows, for example, when the thesis was created and when its status or milestone changed.',
    })
    await caption({
      fi: 'Koko ohjelman tapahtumat ovat lisäksi ohjelman Tapahtumaloki-välilehdellä.',
      sv: 'Händelserna för hela programmet finns dessutom på programmets flik Händelselogg.',
      en: "The whole programme's events are also on the programme's Event log tab.",
    })
  }
)
