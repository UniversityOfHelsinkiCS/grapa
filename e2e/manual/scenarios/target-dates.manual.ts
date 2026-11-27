import { expect, manualTest } from '../fixtures'
import { confirm, openFormPreview, openSettings, sectionOf } from '../steps'

manualTest(
  'Tavoitepäivät',
  {
    annotation: [
      { type: 'en', description: 'Target dates' },
      { type: 'sv', description: 'Måldatum' },
      { type: 'setting', description: 'targetDates' },
    ],
  },
  async ({ page, demo, caption, click, hover, fill, scrollTo, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    const targetDates = sectionOf(
      page,
      t('programOverviewPage:targetDates:title'),
      page.getByRole('button', { name: t('common:addItem') })
    )
    await openSettings(page, t, targetDates)

    await caption({
      fi: 'Tavoitepäivät ovat valmiita vaihtoehtoja tutkielman tavoitepäiväksi. Ne voivat olla esimerkiksi lukukausien viimeiset päivät.',
      sv: 'Måldatum är färdiga alternativ för avhandlingens måldatum, till exempel terminernas sista dagar.',
      en: "Target dates are ready options for a thesis's target date, like the last days of the terms.",
    })
    await caption({
      fi: 'Ohjelmalla on jo yksi tavoitepäivä. Lisätään toinen.',
      sv: 'Programmet har redan ett måldatum. Vi lägger till ett till.',
      en: 'The programme already has one target date. Add another.',
    })
    await click(targetDates.getByRole('button', { name: t('common:addItem') }))
    // The date is typed into its day, month and year, the first of the new date picker
    await fill(targetDates.getByRole('spinbutton').nth(3), '31122027')

    await click(
      targetDates.getByRole('button', {
        name: t('common:saveButton'),
        exact: true,
      })
    )
    await confirm(steps)
    await expect(targetDates.locator('input').nth(1)).toHaveValue('31.12.2027')

    await hover(
      targetDates.getByRole('button', { name: t('deleteButton') }).first()
    )
    await caption({
      fi: 'Tarpeettoman päivän voit poistaa punaisesta painikkeesta. Muista tallentaa muutokset.',
      sv: 'Ett onödigt datum tar du bort med den röda knappen. Kom ihåg att spara ändringarna.',
      en: "Remove a date you don't need with the red button. Remember to save the changes.",
    })

    await scrollTo(page.getByTestId('generalHelperText-preview-button'))
    const preview = await openFormPreview(steps)
    const targetDate = preview.getByRole('combobox', {
      name: new RegExp(`^${t('targetDateHeader')}`),
    })
    await click(targetDate)
    const options = page.getByRole('listbox')
    await expect(
      options.getByRole('option', { name: '31.12.2027' })
    ).toBeVisible()
    await hover(options)
    await caption({
      fi: 'Tutkielmalomakkeella tavoitepäivän voi nyt valita listasta. Ne ovat vain ehdotuksia: Muu päivämäärä sallii minkä tahansa päivän.',
      sv: 'På avhandlingsblanketten kan måldatumet nu väljas i en lista. Det är bara förslag: Anpassat datum tillåter vilket datum som helst.',
      en: 'On the thesis form, the target date can now be chosen from a list. They are only suggestions: Custom date allows any date.',
    })
  }
)
