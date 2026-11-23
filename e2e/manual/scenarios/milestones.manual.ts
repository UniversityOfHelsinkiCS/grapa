import { MILESTONES, THESES } from '../../../src/server/test/manual/demoData'
import { expect, manualTest } from '../fixtures'
import {
  featureLabel,
  openSettings,
  openSupervisedTheses,
  openThesis,
  same,
  sectionOf,
} from '../steps'

// Supervised by the narrator, the first milestone is done
const THESIS = THESES[0]

manualTest(
  'Etapit',
  {
    annotation: [
      { type: 'en', description: 'Milestones' },
      { type: 'sv', description: 'Milstolpar' },
      { type: 'setting', description: 'useMilestones' },
      { type: 'setting', description: 'milestones' },
    ],
  },
  async ({ page, demo, caption, click, hover, scrollTo, curtain, lang, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()

    const milestones = sectionOf(
      page,
      t('programOverviewPage:milestones:title'),
      page.getByRole('button', { name: t('common:addItem') })
    )
    const useMilestones = featureLabel(page, t, 'useMilestones')
    await openSettings(page, t, useMilestones)

    await hover(useMilestones)
    await caption({
      fi: 'Etapit otetaan käyttöön Käytä etappeja -asetuksella. Kun se on päällä, asetuksissa on Etapit-osio, jossa ohjelman etapit määritellään.',
      sv: 'Milstolparna tas i bruk med inställningen Använd milstolpar. När den är på finns avsnittet Milstolpar i inställningarna, där programmets milstolpar bestäms.',
      en: "Milestones are taken into use with Use milestones. With it on, the settings have a Milestones section for defining the programme's milestones.",
    })
    await scrollTo(milestones)
    await caption({
      fi: 'Etapit jakavat tutkielman vaiheisiin. Kun etappi on saavutettu, opiskelija tai ohjaaja merkitsee sen tehdyksi.',
      sv: 'Milstolpar delar in avhandlingen i steg. När en milstolpe har nåtts markerar studenten eller handledaren den som klar.',
      en: 'Milestones split a thesis into steps. When a milestone has been reached, the student or the supervisor marks it as done.',
    })
    const fiNames = milestones.getByLabel('FI', { exact: true })
    await hover(fiNames.first())
    await caption({
      fi: 'Etapit voivat olla esimerkiksi ohjaajalle lähetettyjä versioita: suunnitelma, välivaihe ja lähes valmis tutkielma.',
      sv: 'Milstolparna kan till exempel vara versioner som skickas till handledaren: planen, mellanfasen och en nästan färdig avhandling.',
      en: 'Milestones can be, for example, the versions sent to the supervisor: the plan, a mid-point version and an almost completed thesis.',
    })
    await hover(fiNames.nth(1))
    await hover(fiNames.nth(2))
    await caption({
      fi: 'Jokainen etappi nimetään kolmella kielellä, ja jokainen näkee sen omalla kielellään.',
      sv: 'Varje milstolpe får ett namn på tre språk, och alla ser den på sitt eget språk.',
      en: 'Each milestone is named in three languages, and everyone sees it in their own.',
    })
    await hover(
      milestones.getByRole('button', {
        name: t('common:saveButton'),
        exact: true,
      })
    )
    await caption({
      fi: 'Jos etappeja on muutettu, tallentaminen luo niistä uuden version. Se koskee oletuksena vain tutkielmia, jotka luodaan tallentamisen jälkeen.',
      sv: 'Om milstolparna har ändrats skapas en ny version av dem när du sparar. Den gäller som standard bara avhandlingar som skapas efter det.',
      en: 'If the milestones have changed, saving creates a new version of them. By default, it only applies to theses created after saving.',
    })

    await curtain(same(t('navbar:supervisedTheses')), () =>
      openSupervisedTheses(page, t)
    )
    await hover(page.locator('#milestone-filter'))
    await caption({
      fi: 'Ohjattujen tutkielmien listan voi rajata sen mukaan, missä etapissa tutkielmat ovat.',
      sv: 'Listan över handledda avhandlingar kan avgränsas enligt den milstolpe avhandlingarna är vid.',
      en: 'The list of supervised theses can be filtered by the milestone the theses are at.',
    })

    const thesis = await openThesis(steps, THESIS.topic[lang])
    const currentStep = thesis.locator('li[aria-current="step"]')
    await expect(currentStep).toContainText(MILESTONES[1][lang])
    await hover(currentStep)
    await caption({
      fi: 'Tutkielman edistymisessä näkyvät sen etapit. Tämän tutkielman suunnitelma on jo lähetetty ohjaajalle, joten seuraava etappi on välivaiheen lähettäminen ohjaajalle.',
      sv: 'Avhandlingens framsteg visar dess milstolpar. Planen för den här avhandlingen har redan skickats till handledaren, så nästa milstolpe är att skicka mellanfasen till handledaren.',
      en: "The thesis's progress shows its milestones. This thesis's plan has already been sent to the supervisor, so the next milestone is sending the mid-point version to the supervisor.",
    })

    const actions = thesis.getByRole('group', {
      name: t('progressView:milestoneActionsLabel'),
    })
    const done = actions.getByRole('button').first()
    await hover(done)
    await caption({
      fi: 'Kun välivaihe on lähetetty ohjaajalle, opiskelija tai ohjaaja merkitsee etapin tehdyksi.',
      sv: 'När mellanfasen har skickats till handledaren markerar studenten eller handledaren milstolpen som klar.',
      en: 'Once the mid-point version has been sent to the supervisor, the student or the supervisor marks the milestone as done.',
    })
    await click(done)
    await expect(currentStep).toContainText(MILESTONES[2][lang])
    await hover(
      actions.getByRole('button', { name: t('progressView:cancelButton') })
    )
    await caption({
      fi: 'Jos etappi merkittiin vahingossa, sen voi perua.',
      sv: 'Om milstolpen markerades av misstag kan du ångra det.',
      en: 'If a milestone was marked by mistake, you can undo it.',
    })
  }
)
