import {
  MANAGER,
  MASTER_PROGRAM,
  NEW_STUDENT,
  STUDY_TRACKS,
  SUPERVISORS,
} from '../../../src/server/test/manual/demoData'
import { expect, manualTest } from '../fixtures'
import {
  choosePerson,
  featureLabel,
  featureSwitch,
  openSettings,
  openThesis,
  pdf,
  toggleFeature,
  upload,
} from '../steps'

const TOPIC = {
  fi: 'Hulevesialtaat kaupunkiluonnon elinympäristöinä',
  sv: 'Dagvattendammar som livsmiljöer i stadsnaturen',
  en: 'Stormwater ponds as urban habitats',
}
const RESEARCH_PLAN = {
  fi: 'aihekuvaus.pdf',
  sv: 'amnesbeskrivning.pdf',
  en: 'topic-description.pdf',
}
const SUPERVISOR = SUPERVISORS[0]

manualTest(
  'Ohjaajan valinta',
  {
    annotation: [
      { type: 'en', description: 'Choosing the supervisor' },
      { type: 'sv', description: 'Val av handledare' },
      { type: 'setting', description: 'allowThesisWithoutSupervisor' },
      { type: 'setting', description: 'supervisorOptional' },
    ],
  },
  async ({ page, demo, caption, click, hover, fill, curtain, lang, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    await openSettings(
      page,
      t,
      featureLabel(page, t, 'allowStudentStartedProcess')
    )

    await toggleFeature(steps, 'allowStudentStartedProcess', {
      fi: 'Ohjaajan valinnan piilottaminen on opiskelijalähtöistä prosessia varten, jossa opiskelija aloittaa tutkielman itse. Se otetaan ensin käyttöön.',
      sv: 'Att dölja valet av handledare är till för processen som studerande startar, där studenten själv inleder avhandlingen. Den tas först i bruk.',
      en: 'Hiding the supervisor selection is for the student started process, where the student starts the thesis themselves. It is switched on first.',
    })
    await toggleFeature(steps, 'allowThesisWithoutSupervisor', {
      fi: 'Kun ohjaajan valinta on piilotettu, opiskelija ei valitse ohjaajaa, vaan ohjelman tai opintosuunnan vastaava lisää sen tutkielmaan.',
      sv: 'När valet av handledare är dolt väljer studenten inte handledaren, utan den ansvariga för programmet eller studieinriktningen lägger till den.',
      en: "With the supervisor selection hidden, the student doesn't choose the supervisor; the programme or study track manager adds one to the thesis.",
    })
    const optional = featureSwitch(page, t, 'supervisorOptional')
    await hover(featureLabel(page, t, 'supervisorOptional'))
    await caption({
      fi: 'Samalla ohjaajasta tuli valinnainen, joten tutkielman voi tallentaa ilman ohjaajaa. Valinta pysyy päällä niin kauan kuin ohjaajan valinta on piilotettu.',
      sv: 'Samtidigt blev handledaren valfri, så avhandlingen kan sparas utan handledare. Inställningen förblir på så länge valet är dolt.',
      en: 'This also made the supervisor optional, so a thesis can be saved without one. It stays on for as long as the selection is hidden.',
    })
    await expect(optional).toBeChecked()
    await expect(optional).toBeDisabled()

    await curtain(
      {
        fi: 'Opiskelijan näkymä',
        sv: 'Studentens vy',
        en: "The student's view",
      },
      () => demo.loginAs(NEW_STUDENT)
    )
    await click(
      page.getByRole('button', {
        name: t('thesesTableToolbar:newThesisButton'),
      })
    )
    const form = page.getByRole('dialog', {
      name: t('thesisForm:newThesisFormTitle'),
    })
    await expect(form).toBeVisible()
    await fill(
      form.getByTestId('topic-select-input').getByRole('textbox'),
      TOPIC[lang]
    )
    await click(form.getByTestId('study-track-select-input'))
    await click(
      page.getByRole('option', {
        name: STUDY_TRACKS[0].name[lang],
        exact: true,
      })
    )
    await upload(steps, form.locator('#researchPlan'), pdf(RESEARCH_PLAN[lang]))
    await expect(
      form.getByRole('group', { name: t('thesisForm:supervisors') })
    ).toBeHidden()
    await hover(form.getByText(RESEARCH_PLAN[lang]))
    await caption({
      fi: 'Opiskelijan lomakkeella ei ole ohjaajan valintaa, joten ehdotus lähetetään ilman ohjaajaa.',
      sv: 'Studentens blankett har inget val av handledare, så förslaget skickas utan handledare.',
      en: "The student's form has no supervisor selection, so the suggestion is sent without a supervisor.",
    })
    await click(form.getByTestId('submit-button'))
    const confirmSend = page.getByRole('dialog', {
      name: t('viewThesisFooter:sendDraftButtonConfirmTitle'),
    })
    await click(
      confirmSend.getByRole('button', {
        name: t('viewThesisFooter:sendDraftButton'),
      })
    )
    await expect(form).toBeHidden()

    await curtain(
      {
        fi: 'Ohjelman vastaavan näkymä',
        sv: 'Programansvarigs vy',
        en: "The programme manager's view",
      },
      async () => {
        await demo.loginAsManager()
        await page.goto(`/programs/${MASTER_PROGRAM.id}`)
        await expect(
          page.getByText(TOPIC[lang], { exact: true }).first()
        ).toBeVisible()
      }
    )
    const thesis = await openThesis(steps, TOPIC[lang])
    const approve = thesis.getByRole('button', {
      name: t('approveButton'),
      exact: true,
    })
    await hover(approve)
    await caption({
      fi: 'Ehdotus näkyy ohjelman Tutkielmat-välilehdellä. Ohjelman vastaava hyväksyy sen ja lisää sitten tutkielmaan ohjaajan.',
      sv: 'Förslaget visas på programmets flik Avhandlingar. Den programansvariga godkänner det och lägger sedan till en handledare.',
      en: "The suggestion is shown on the programme's Theses tab. The programme manager approves it and then adds a supervisor to the thesis.",
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

    await click(
      thesis.getByRole('button', { name: t('editButton'), exact: true })
    )
    const editForm = page.getByRole('dialog', {
      name: t('thesisForm:editThesisFormTitle'),
    })
    // A thesis without a supervisor has no supervisor row yet
    const addPerson = async (group: 'supervisor' | 'grader') => {
      await click(editForm.getByTestId(`add-${group}-button`))
      await click(page.getByTestId(`add-${group}-menu-item-internal`))
    }
    await hover(editForm.getByTestId('add-supervisor-button'))
    await caption({
      fi: 'Ohjaaja lisätään tutkielman muokkauslomakkeella. Ohjaajan kanssa lisätään myös arvioija.',
      sv: 'Handledaren läggs till på avhandlingens redigeringsblankett. Samtidigt läggs också en bedömare till.',
      en: 'The supervisor is added on the edit form of the thesis. A grader is added with the supervisor.',
    })
    await addPerson('supervisor')
    await choosePerson(
      steps,
      fill,
      editForm.getByTestId('supervisor-select-input-1').getByRole('combobox'),
      SUPERVISOR.lastName
    )
    if (!(await editForm.getByTestId('grader-select-input-1').isVisible()))
      await addPerson('grader')
    await choosePerson(
      steps,
      fill,
      editForm.getByTestId('grader-select-input-1').getByRole('combobox'),
      SUPERVISOR.lastName
    )
    // The staff form also asks for the programme manager handling the thesis
    await click(editForm.getByTestId('approver-select-input'))
    await click(
      page.getByRole('option', { name: new RegExp(MANAGER.lastName) }).first()
    )
    await click(editForm.getByTestId('submit-button'))
    await expect(editForm).toBeHidden()

    const supervisorName = thesis
      .getByText(`${SUPERVISOR.firstName} ${SUPERVISOR.lastName}`)
      .first()
    await expect(supervisorName).toBeVisible()
    await hover(supervisorName)
    await caption({
      fi: 'Tutkielmalla on nyt ohjaaja.',
      sv: 'Avhandlingen har nu en handledare.',
      en: 'The thesis now has a supervisor.',
    })
  }
)
