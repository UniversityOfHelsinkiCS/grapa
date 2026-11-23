import { MILESTONES, THESES } from '../../../src/server/test/manual/demoData'
import { expect, manualTest } from '../fixtures'
import {
  featureLabel,
  featureSwitch,
  openSettings,
  openSupervisedTheses,
  openThesis,
  pdf,
  same,
  toggleFeature,
  upload,
} from '../steps'

// Supervised by the narrator, the mid-point version is in progress
const THESIS = THESES[0]
const FILE = {
  fi: 'valivaihe.pdf',
  sv: 'mellanfas.pdf',
  en: 'mid-point-version.pdf',
}

manualTest(
  'Etappien tiedostot',
  {
    annotation: [
      { type: 'en', description: 'Milestone files' },
      { type: 'sv', description: 'Filer för milstolpar' },
      { type: 'setting', description: 'allowMilestoneAttachments' },
    ],
  },
  async ({ page, demo, caption, click, hover, curtain, lang, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    await openSettings(
      page,
      t,
      featureLabel(page, t, 'allowMilestoneAttachments')
    )

    await hover(featureLabel(page, t, 'useMilestones'))
    await caption({
      fi: 'Etappien tiedostot vaativat, että Käytä etappeja on päällä.',
      sv: 'Filer för milstolpar kräver att Använd milstolpar är på.',
      en: 'Milestone files need Use milestones to be on.',
    })
    await toggleFeature(steps, 'allowMilestoneAttachments', {
      fi: 'Kun etappien tiedostot on sallittu, käynnissä olevaan etappiin voi liittää enintään viisi PDF-tiedostoa, esimerkiksi ohjaajalle lähetetyn version.',
      sv: 'När filer för milstolpar är tillåtna kan högst fem PDF-filer bifogas till den pågående milstolpen, till exempel versionen som skickas till handledaren.',
      en: 'With milestone files allowed, up to five PDF files can be attached to the milestone in progress, like the version sent to the supervisor.',
    })
    const useMilestones = featureSwitch(page, t, 'useMilestones')
    await hover(useMilestones)
    await caption({
      fi: 'Niin kauan kuin tiedostot ovat sallittuja, etappeja ei voi poistaa käytöstä.',
      sv: 'Så länge filer är tillåtna kan milstolparna inte stängas av.',
      en: "As long as files are allowed, milestones can't be switched off.",
    })
    await expect(useMilestones).toBeDisabled()

    await curtain(same(t('navbar:supervisedTheses')), () =>
      openSupervisedTheses(page, t)
    )
    const thesis = await openThesis(steps, THESIS.topic[lang])
    const currentStep = thesis.locator('li[aria-current="step"]')
    await expect(currentStep).toContainText(MILESTONES[1][lang])
    const uploadButton = currentStep.getByRole('button', {
      name: t('progressView:uploadFile'),
    })
    await hover(uploadButton)
    await caption({
      fi: 'Käynnissä olevan etapin kohdalla on nyt painike tiedostojen lataamiseen. Tiedostoja voivat ladata opiskelija ja kaikki, jotka voivat muokata tutkielmaa.',
      sv: 'Vid den pågående milstolpen finns nu en knapp för att ladda upp filer. Studenten och alla som kan redigera avhandlingen kan ladda upp filer.',
      en: 'The milestone in progress now has a button for uploading files. The student and everyone who can edit the thesis can upload them.',
    })
    await upload(steps, uploadButton, pdf(FILE[lang]))
    const uploaded = currentStep.getByText(FILE[lang])
    await expect(uploaded).toBeVisible()
    await hover(uploaded)
    await caption({
      fi: 'Ladattu tiedosto näkyy etapin alla, ja sen voi vielä poistaa.',
      sv: 'Den uppladdade filen visas under milstolpen och kan ännu tas bort.',
      en: 'The uploaded file is shown under the milestone and can still be removed.',
    })

    const done = thesis
      .getByRole('group', { name: t('progressView:milestoneActionsLabel') })
      .getByRole('button')
      .first()
    await hover(done)
    await caption({
      fi: 'Kun etappi merkitään tehdyksi, sen tiedostot jäävät näkyviin, mutta niitä ei voi enää muuttaa.',
      sv: 'När milstolpen markeras som klar förblir dess filer synliga, men de kan inte längre ändras.',
      en: "When the milestone is marked as done, its files stay visible but can't be changed anymore.",
    })
    await click(done)
    const fileLink = thesis
      .locator('li')
      .filter({ hasText: MILESTONES[1][lang] })
      .getByRole('link', { name: FILE[lang] })
    await expect(fileLink).toBeVisible()
    await hover(fileLink)
    await caption({
      fi: 'Jos etappiin ei ole ladattu tiedostoja, sen merkitseminen tehdyksi pitää vielä vahvistaa.',
      sv: 'Om inga filer har laddats upp för milstolpen måste du ännu bekräfta att den är klar.',
      en: 'If no files have been uploaded for a milestone, marking it as done must be confirmed.',
    })
  }
)
