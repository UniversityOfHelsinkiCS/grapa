import { STUDY_TRACKS } from '../../../src/server/test/manual/demoData'
import { expect, manualTest } from '../fixtures'
import { confirm, openFormPreview, openSettings, sectionOf } from '../steps'

manualTest(
  'Opintosuuntien yhdistäminen',
  {
    annotation: [
      { type: 'en', description: 'Combining study tracks' },
      { type: 'sv', description: 'Slå samman studieinriktningar' },
      { type: 'setting', description: 'combinedStudyTracks' },
    ],
  },
  async ({ page, demo, caption, click, hover, scrollTo, lang, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    const combined = sectionOf(
      page,
      t('programOverviewPage:combinedStudyTracks:title'),
      page.getByRole('button', { name: t('common:addItem') })
    )
    await openSettings(page, t, combined)

    await caption({
      fi: 'Opintosuunnat tulevat opintotietojärjestelmästä sellaisinaan. Mukana on usein myös vanhoja tai käyttämättömiä opintosuuntia, esimerkiksi aiempien opetussuunnitelmien ajalta.',
      sv: 'Studieinriktningarna kommer från studieinformationssystemet som de är. Ofta finns även gamla eller oanvända inriktningar med, till exempel från tidigare läroplaner.',
      en: 'Study tracks come from the student information system as they are. They often include old or unused tracks too, for example from earlier curricula.',
    })
    await caption({
      fi: 'Yhdistämällä ne käytössä olevaan opintosuuntaan lomakkeilla näkyvät vain opintosuunnat, joita oikeasti käytetään.',
      sv: 'Genom att slå samman dem med en inriktning som används visas bara de inriktningar som faktiskt används på blanketterna.',
      en: 'Combining them with a track in use leaves only the tracks actually in use on the forms.',
    })
    await click(combined.getByRole('button', { name: t('common:addItem') }))

    const [nature, , , oldNature] = STUDY_TRACKS
    // The primary track's select has no accessible name, it's the first in the new combination
    await click(combined.getByRole('combobox').first())
    await click(
      page.getByRole('option', { name: nature.name[lang], exact: true })
    )
    await click(
      combined.getByRole('combobox', {
        name: t('programOverviewPage:combinedStudyTracks:secondaries'),
      })
    )
    await click(
      page.getByRole('option', { name: oldNature.name[lang], exact: true })
    )
    // Closes the list of tracks
    await click(
      combined.getByRole('heading', {
        name: t('programOverviewPage:combinedStudyTracks:title'),
      })
    )
    await caption({
      fi: `Ensisijaiseksi valitaan nykyinen ${nature.name.fi}, toissijaiseksi vanha ${oldNature.name.fi}. Toissijainen piilotetaan lomakkeilta, ja sen tilalla käytetään ensisijaista.`,
      sv: `Den nuvarande ${nature.name.sv} väljs som primär, den gamla ${oldNature.name.sv} som sekundär. Den sekundära döljs på blanketterna, och den primära används i stället.`,
      en: `The current ${nature.name.en} is chosen as the primary track, the old ${oldNature.name.en} as the secondary one. The secondary track is hidden from the forms, and the primary one is used instead.`,
    })
    await click(
      combined.getByRole('button', {
        name: t('common:submitButton'),
        exact: true,
      })
    )
    await confirm(steps)

    // The preview's chips are small, the selected secondary tracks are chips too
    const visibleTracks = combined.locator('.MuiChip-sizeSmall')
    await hover(visibleTracks.first())
    await expect(visibleTracks).toHaveCount(3)
    await caption({
      fi: 'Esikatselu näyttää opintosuunnat, joista lomakkeilla voi nyt valita.',
      sv: 'Förhandsgranskningen visar de studieinriktningar som nu kan väljas på blanketterna.',
      en: 'The preview shows the study tracks that can now be chosen on the forms.',
    })

    await scrollTo(page.getByTestId('generalHelperText-preview-button'))
    const preview = await openFormPreview(steps)
    await click(preview.getByTestId('study-track-select-input'))
    const tracks = page.getByRole('listbox')
    await expect(
      tracks.getByRole('option', { name: oldNature.name[lang] })
    ).toHaveCount(0)
    await hover(
      tracks.getByRole('option', { name: nature.name[lang], exact: true })
    )
    await caption({
      fi: `Tutkielmalomakkeelta vanha opintosuunta ${oldNature.name.fi} on nyt poissa, joten kukaan ei valitse sitä vahingossa.`,
      sv: `På avhandlingsblanketten finns den gamla inriktningen ${oldNature.name.sv} inte längre, så ingen väljer den av misstag.`,
      en: `The old track ${oldNature.name.en} is now gone from the thesis form, so no one picks it by mistake.`,
    })
  }
)
