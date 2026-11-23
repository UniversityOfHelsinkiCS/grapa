import { expect, manualTest } from '../fixtures'
import {
  closeDialog,
  featureLabel,
  openFormPreview,
  openSettings,
  toggleFeature,
} from '../steps'

manualTest(
  'Opintosuuntien poistaminen käytöstä',
  {
    annotation: [
      { type: 'en', description: 'Disabling study tracks' },
      { type: 'sv', description: 'Stänga av studieinriktningar' },
      { type: 'setting', description: 'disableStudyTracks' },
    ],
  },
  async ({ page, demo, caption, click, hover, scrollTo, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    const setting = featureLabel(page, t, 'disableStudyTracks')
    const previewButton = page.getByTestId('generalHelperText-preview-button')
    await openSettings(page, t, setting)

    await hover(setting)
    await caption({
      fi: 'Poista opintosuunnat käytöstä on ohjelmille, joilla ei ole opintosuuntia tai jotka eivät käytä niitä.',
      sv: 'Inaktivera studieinriktningar är för program som inte har eller inte använder studieinriktningar.',
      en: "Disable study tracks is for programmes that don't have or don't use study tracks.",
    })

    await scrollTo(previewButton)
    let preview = await openFormPreview(steps)
    await hover(preview.getByTestId('study-track-select-input'))
    await caption({
      fi: 'Oletuksena tutkielmalomakkeella valitaan tutkielman opintosuunta.',
      sv: 'Som standard väljs avhandlingens studieinriktning på avhandlingsblanketten.',
      en: 'By default, the study track of a thesis is chosen on the thesis form.',
    })
    await closeDialog(steps, preview)

    await scrollTo(setting)
    await toggleFeature(steps, 'disableStudyTracks')

    await scrollTo(previewButton)
    preview = await openFormPreview(steps)
    await hover(preview.getByTestId('program-select-input'))
    await expect(preview.getByTestId('study-track-select-input')).toBeHidden()
    await caption({
      fi: 'Kun asetus on päällä, lomakkeella ei kysytä opintosuuntaa, eikä uusille tutkielmille tallenneta sitä.',
      sv: 'När inställningen är på frågar blanketten inte efter studieinriktning, och den sparas inte för nya avhandlingar.',
      en: "With the setting on, the form doesn't ask for a study track, and new theses don't get one.",
    })
  }
)
