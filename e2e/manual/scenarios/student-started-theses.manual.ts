import {
  MANAGER,
  MILESTONES,
  NEW_STUDENT,
  STUDY_TRACKS,
} from '../../../src/server/test/manual/demoData'
import { expect, manualTest } from '../fixtures'
import {
  choosePerson,
  closeDialog,
  featureLabel,
  openSettings,
  openSupervisedTheses,
  openThesis,
  pdf,
  toggleFeature,
  upload,
} from '../steps'

// Typed in the rejection, which is cancelled
const REJECTION = {
  fi: 'Rajaa aihe vielä yhteen kaupunkiin.',
  sv: 'Avgränsa ännu ämnet till en stad.',
  en: 'Narrow the topic down to one city.',
}
const TOPIC = {
  fi: 'Kaupunkilinnut ja valosaaste',
  sv: 'Stadsfåglar och ljusföroreningar',
  en: 'Urban birds and light pollution',
}
const RESEARCH_PLAN = {
  fi: 'aihekuvaus.pdf',
  sv: 'amnesbeskrivning.pdf',
  en: 'topic-description.pdf',
}

manualTest(
  'Opiskelijan aloittamat tutkielmat',
  {
    annotation: [
      { type: 'en', description: 'Theses started by students' },
      { type: 'sv', description: 'Avhandlingar som studenter startar' },
      { type: 'setting', description: 'allowStudentStartedProcess' },
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

    await caption({
      fi: 'Oletuksena henkilökunta luo tutkielmat. Opiskelijalähtöisessä prosessissa opiskelija aloittaa tutkielman itse ja lähettää siitä ehdotuksen ohjaajalle.',
      sv: 'Som standard skapar personalen avhandlingarna. När studenten startar processen påbörjar studenten avhandlingen själv och skickar ett förslag till handledaren.',
      en: 'By default, staff create the theses. In the student started process, the student starts the thesis and sends it to the supervisor as a suggestion.',
    })
    await toggleFeature(steps, 'allowStudentStartedProcess')

    await curtain(
      {
        fi: 'Opiskelijan näkymä',
        sv: 'Studentens vy',
        en: "The student's view",
      },
      () => demo.loginAs(NEW_STUDENT)
    )
    await caption({
      fi: 'Opiskelija, jolla on opinto-oikeus ohjelmaan, aloittaa tutkielman Omat tutkielmat -sivulla.',
      sv: 'En student med studierätt i programmet påbörjar avhandlingen på sidan Mina avhandlingar.',
      en: 'A student with a study right in the programme starts the thesis on the My theses page.',
    })
    await click(
      page.getByRole('button', {
        name: t('thesesTableToolbar:newThesisButton'),
      })
    )
    const form = page.getByRole('dialog', {
      name: t('thesisForm:newThesisFormTitle'),
    })
    await expect(form).toBeVisible()

    await caption({
      fi: 'Opiskelija kirjoittaa aiheen, valitsee opintosuunnan ja ohjaajan ja liittää aihekuvauksen.',
      sv: 'Studenten skriver ämnet, väljer studieinriktning och handledare och bifogar en ämnesbeskrivning.',
      en: 'The student writes the topic, chooses the study track and the supervisor, and attaches a topic description.',
    })
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
    await choosePerson(
      steps,
      fill,
      form.getByTestId('supervisor-select-input-1').getByRole('combobox'),
      MANAGER.lastName
    )
    await upload(steps, form.locator('#researchPlan'), pdf(RESEARCH_PLAN[lang]))
    await expect(form.getByText(RESEARCH_PLAN[lang])).toBeVisible()

    await hover(
      form.getByRole('button', {
        name: t('viewThesisFooter:saveAsDraftButton'),
      })
    )
    await caption({
      fi: 'Keskeneräisen tutkielman voi tallentaa luonnokseksi. Valmis tutkielma lähetetään ohjaajalle ehdotuksena.',
      sv: 'En ofärdig avhandling kan sparas som utkast. En färdig skickas till handledaren som ett förslag.',
      en: 'An unfinished thesis can be saved as a draft. A finished one is sent to the supervisor as a suggestion.',
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

    const studentThesis = await openThesis(steps, TOPIC[lang])
    const suggested = studentThesis.locator('li[aria-current="step"]')
    await expect(suggested).toContainText(t('thesisStages:suggested'))
    await hover(suggested)
    await caption({
      fi: 'Lähetettyä ehdotusta ei voi enää muokata. Edistymisessä näkyvät nyt luonnos- ja ehdotusvaiheet ennen tutkielman aloittamista.',
      sv: 'Ett skickat förslag kan inte längre redigeras. Framstegen visar nu stegen utkast och förslag innan avhandlingen inleds.',
      en: "A suggestion that has been sent can't be edited anymore. The progress now shows the draft and suggestion steps before the thesis starts.",
    })

    await curtain(
      {
        fi: 'Ohjaajan näkymä',
        sv: 'Handledarens vy',
        en: "The supervisor's view",
      },
      async () => {
        await demo.loginAsManager()
        await openSupervisedTheses(page, t)
      }
    )
    // The chip's accessible name is its tooltip, so it's found by its label
    const suggestions = page.getByText(
      t('thesesTableToolbar:filterViews:suggested:name'),
      { exact: true }
    )
    await hover(suggestions)
    await caption({
      fi: 'Ehdotus näkyy ohjaajan Ohjatut tutkielmat -sivulla. Kaikki odottavat ehdotukset löytyvät tästä suodattimesta.',
      sv: 'Förslaget visas på handledarens sida Handledda avhandlingar. Alla väntande förslag finns i det här filtret.',
      en: "The suggestion is shown on the supervisor's Supervised theses page. All waiting suggestions are in this filter.",
    })
    await click(suggestions)

    const thesis = await openThesis(steps, TOPIC[lang])
    const approve = thesis.getByRole('button', {
      name: t('approveButton'),
      exact: true,
    })
    const reject = thesis.getByRole('button', {
      name: t('viewThesisFooter:rejectButton'),
    })
    await hover(reject)
    await caption({
      fi: 'Jos ehdotusta pitää vielä korjata, sen voi hylätä.',
      sv: 'Om förslaget ännu behöver rättas kan det avvisas.',
      en: 'If the suggestion still needs changes, it can be rejected.',
    })
    await click(reject)
    const rejection = page.getByRole('dialog', {
      name: t('viewThesisFooter:rejectButtonConfirmTitle'),
    })
    await fill(
      rejection.getByRole('textbox', {
        name: t('viewThesisFooter:rejectMessageToStudent'),
      }),
      REJECTION[lang]
    )
    await caption({
      fi: 'Hylkäykseen kirjoitetaan opiskelijalle, mitä pitää muuttaa. Tutkielma palaa luonnokseksi, ja opiskelija voi lähettää sen uudelleen. Tällä kertaa ehdotus kuitenkin hyväksytään, joten hylkäys perutaan.',
      sv: 'I avvisningen skriver du till studenten vad som ska ändras. Avhandlingen blir ett utkast igen, och studenten kan skicka den på nytt. Den här gången godkänns förslaget ändå, så avvisningen avbryts.',
      en: 'The rejection tells the student what to change. The thesis goes back to being a draft, and the student can send it again. This time the suggestion is approved though, so the rejection is cancelled.',
    })
    await closeDialog(steps, rejection)

    await hover(approve)
    await caption({
      fi: 'Ehdotuksen hyväksyy ohjelman vastaava, jolla on hyväksymisoikeus. Tässä ohjaaja on itse sellainen, joten hän voi hyväksyä sen. Muuten ohjaaja voi hyväksyä ehdotuksen vain, jos ohjaajan hyväksyntä on päällä.',
      sv: 'Förslaget godkänns av en programansvarig med rätt att godkänna. Här är handledaren själv en sådan och kan godkänna det. Annars kan handledaren godkänna förslaget bara om handledares godkännande är på.',
      en: 'The suggestion is approved by a programme manager with approval rights. Here the supervisor is one, so they can approve it. Otherwise a supervisor can approve suggestions only if supervisor approval is on.',
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
      fi: 'Tutkielma on nyt käynnissä. Jos ohjelmassa on käytössä etapit, se etenee etappi kerrallaan. Lopuksi ohjaaja antaa opiskelijalle luvan palauttaa tutkielma E-thesikseen.',
      sv: 'Avhandlingen pågår nu. Om programmet använder milstolpar framskrider den en milstolpe i taget. Till sist ger handledaren studenten lov att lämna in avhandlingen till E-thesis.',
      en: 'The thesis is now in progress. If the programme uses milestones, it moves on one milestone at a time. Finally, the supervisor gives the student permission to submit it to E-thesis.',
    })
  }
)
