import { expect, manualTest } from '../fixtures'
import {
  closeDialog,
  featureLabel,
  featureSwitch,
  openFormPreview,
  openSettings,
  toggleFeature,
} from '../steps'

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
  async ({ page, demo, caption, click, hover, scrollTo, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    const previewButton = page.getByTestId('generalHelperText-preview-button')
    const setting = featureLabel(page, t, 'allowThesisWithoutSupervisor')
    await openSettings(page, t, setting)

    await hover(setting)
    await caption({
      fi: 'Piilota ohjaajan valinta opiskelijalta on ohjelmille, joissa ohjaajan valitsee ohjelma eikä opiskelija.',
      sv: 'Dölj val av handledare för studenten är för program där programmet och inte studenten väljer handledaren.',
      en: 'Hide supervisor selection from the student is for programmes where the programme chooses the supervisor instead of the student.',
    })
    await scrollTo(previewButton)
    let preview = await openFormPreview(steps)
    const supervisors = preview.getByRole('group', {
      name: t('thesisForm:supervisors'),
    })
    await scrollTo(supervisors)
    await hover(supervisors)
    await caption({
      fi: 'Oletuksena opiskelija valitsee ohjaajansa itse tutkielmalomakkeella, ja ohjaaja on pakollinen.',
      sv: 'Som standard väljer studenten själv sin handledare på avhandlingsblanketten, och handledaren är obligatorisk.',
      en: 'By default, students choose their supervisor themselves on the thesis form, and a supervisor is required.',
    })
    await closeDialog(steps, preview)

    await scrollTo(setting)
    await toggleFeature(steps, 'allowThesisWithoutSupervisor')
    const optional = featureSwitch(page, t, 'supervisorOptional')
    await hover(featureLabel(page, t, 'supervisorOptional'))
    await caption({
      fi: 'Samalla ohjaajasta tuli valinnainen, joten tutkielman voi tallentaa ilman ohjaajaa. Valinta pysyy päällä niin kauan kuin ohjaajan valinta on piilotettu.',
      sv: 'Samtidigt blev handledaren valfri, så avhandlingen kan sparas utan handledare. Inställningen förblir på så länge valet är dolt.',
      en: 'This also made the supervisor optional, so a thesis can be saved without one. It stays on for as long as the selection is hidden.',
    })
    await expect(optional).toBeChecked()
    await expect(optional).toBeDisabled()

    await scrollTo(previewButton)
    preview = await openFormPreview(steps)
    await scrollTo(
      preview
        .getByRole('group', { name: t('thesisForm:graders') })
        .or(preview.getByRole('group', { name: t('thesisForm:appendices') }))
    )
    await expect(
      preview.getByRole('group', { name: t('thesisForm:supervisors') })
    ).toBeHidden()
    await caption({
      fi: 'Opiskelijan lomakkeelta puuttuu nyt ohjaajan valinta. Ohjelman tai opintosuunnan vastaava lisää ohjaajan tutkielmaan.',
      sv: 'Studentens blankett saknar nu valet av handledare. Den ansvariga för programmet eller studieinriktningen lägger till handledaren.',
      en: "The student's form no longer has the supervisor selection. The programme or study track manager adds the supervisor to the thesis.",
    })
  }
)
