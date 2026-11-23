import {
  MILESTONES,
  SUPERVISORS,
  THESES,
} from '../../../src/server/test/manual/demoData'
import { expect, manualTest } from '../fixtures'
import {
  featureLabel,
  openSettings,
  openSupervisedTheses,
  openThesis,
  toggleFeature,
} from '../steps'

// Waits for approval, supervised by a supervisor who isn't a programme manager
const THESIS = THESES[2]
const SUPERVISOR = SUPERVISORS[2]

manualTest(
  'Ohjaajan hyväksyntä',
  {
    annotation: [
      { type: 'en', description: 'Supervisor approval' },
      { type: 'sv', description: 'Handledares godkännande' },
      { type: 'setting', description: 'supervisorApproval' },
    ],
  },
  async ({ page, demo, caption, click, hover, curtain, lang, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    await openSettings(page, t, featureLabel(page, t, 'supervisorApproval'))

    await caption({
      fi: 'Uusi tutkielma on suunnitteluvaiheessa, kunnes se hyväksytään. Oletuksena sen hyväksyy ohjelman vastaava, jolla on hyväksymisoikeus.',
      sv: 'En ny avhandling är i planeringsfasen tills den godkänns. Som standard godkänns den av en programansvarig med rätt att godkänna.',
      en: 'A new thesis is being planned until it is approved. By default, a programme manager with approval rights approves it.',
    })
    await toggleFeature(steps, 'supervisorApproval', {
      fi: 'Ohjaajan hyväksynnällä myös tutkielman ohjaaja voi hyväksyä sen.',
      sv: 'Med handledares godkännande kan även avhandlingens handledare godkänna den.',
      en: 'With supervisor approval, the supervisor of a thesis can approve it too.',
    })

    await curtain(
      {
        fi: 'Ohjaajan näkymä',
        sv: 'Handledarens vy',
        en: "The supervisor's view",
      },
      async () => {
        await demo.loginAs(SUPERVISOR)
        await openSupervisedTheses(page, t)
      }
    )
    const thesis = await openThesis(steps, THESIS.topic[lang])
    const waiting = thesis.getByText(t('viewThesisFooter:requiresApproval'))
    await hover(waiting)
    await caption({
      fi: 'Ohjaaja näkee nyt, että suunnitteluvaiheen tutkielma odottaa hänen hyväksyntäänsä.',
      sv: 'Handledaren ser nu att avhandlingen i planeringsfasen väntar på hens godkännande.',
      en: 'The supervisor now sees that the thesis being planned is waiting for their approval.',
    })
    const approve = thesis.getByRole('button', {
      name: t('approveButton'),
      exact: true,
    })
    await click(approve)
    const confirmApproval = page.getByRole('dialog', {
      name: t('approveButtonConfirmTitle'),
    })
    await click(
      confirmApproval.getByRole('button', {
        name: t('approveButton'),
        exact: true,
      })
    )
    await expect(confirmApproval).toBeHidden()
    const firstMilestone = thesis.locator('li[aria-current="step"]')
    await expect(firstMilestone).toContainText(MILESTONES[0][lang])
    await hover(firstMilestone)
    await caption({
      fi: 'Hyväksytty tutkielma on käynnissä, eikä sen tarvitse odottaa ohjelman vastaavaa.',
      sv: 'Den godkända avhandlingen pågår och behöver inte vänta på den programansvariga.',
      en: "The approved thesis is in progress and doesn't need to wait for the programme manager.",
    })
  }
)
