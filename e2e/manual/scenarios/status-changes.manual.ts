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

// Being planned, the narrator is its programme manager
const THESIS = THESES[2]

manualTest(
  'Manuaaliset tilamuutokset',
  {
    annotation: [
      { type: 'en', description: 'Manual status changes' },
      { type: 'sv', description: 'Manuella statusändringar' },
      { type: 'setting', description: 'allowStatusChanges' },
    ],
  },
  async ({ page, demo, caption, click, hover, curtain, lang, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    await openSettings(page, t, featureLabel(page, t, 'allowStatusChanges'))

    await caption({
      fi: 'Tutkielman tila muuttuu yleensä sen mukaan, mitä tutkielmalle tehdään: hyväksyntä aloittaa sen, ja etapit merkitään yksi kerrallaan.',
      sv: 'Avhandlingens status ändras oftast efter vad som görs med den: godkännandet inleder den, och milstolparna markeras en i taget.',
      en: "A thesis's status usually changes with what is done to it: approval starts it, and milestones are marked one at a time.",
    })
    await toggleFeature(steps, 'allowStatusChanges', {
      fi: 'Manuaalisilla tilamuutoksilla henkilökunta voi valita tilan ja etapin itse muokkauslomakkeella.',
      sv: 'Med manuella statusändringar kan personalen själv välja status och milstolpe på redigeringsblanketten.',
      en: 'With manual status changes, staff can choose the status and the milestone themselves on the edit form.',
    })

    await curtain(same(t('navbar:supervisedTheses')), () =>
      openSupervisedTheses(page, t)
    )
    const thesis = await openThesis(steps, THESIS.topic[lang])
    await click(
      thesis.getByRole('button', { name: t('editButton'), exact: true })
    )
    const form = page.getByRole('dialog', {
      name: t('thesisForm:editThesisFormTitle'),
    })
    const status = form.getByTestId('status-select-input')
    await click(status)
    const options = page.getByRole('listbox')
    await expect(options).toBeVisible()
    await hover(options)
    await caption({
      fi: 'Muokkauslomakkeella on nyt Tila-valinta myös suunnitteluvaiheen tutkielmalle, ja tilan voi vaihtaa mihin tahansa.',
      sv: 'Redigeringsblanketten har nu ett statusval även för en avhandling i planeringsfasen, och statusen kan ändras till vilken som helst.',
      en: 'The edit form now has a status choice even for a thesis being planned, and the status can be changed to any of them.',
    })
    await click(
      options.getByRole('option', {
        name: t('thesisStages:inProgress'),
        exact: true,
      })
    )
    const milestone = form.getByTestId('milestone-select-input')
    await expect(milestone).toBeVisible()
    await hover(milestone)
    await caption({
      fi: 'Samalla voi valita, missä etapissa tutkielma on. Muutos tallentuu tutkielman tapahtumiin.',
      sv: 'Samtidigt kan du välja vid vilken milstolpe avhandlingen är. Ändringen sparas i avhandlingens händelser.',
      en: 'You can also choose which milestone the thesis is at. The change is saved in the events of the thesis.',
    })
  }
)
