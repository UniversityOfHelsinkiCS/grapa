import {
  CO_MANAGER,
  MASTER_PROGRAM,
  NEW_MANAGER,
  TRACK_MANAGER,
} from '../../../src/server/test/manual/demoData'
import { expect, manualTest } from '../fixtures'

manualTest(
  'Ohjelman vastaavat',
  {
    annotation: [
      { type: 'en', description: 'Programme managers' },
      { type: 'sv', description: 'Programmets ansvariga' },
    ],
  },
  async ({ page, demo, caption, click, hover, fill, t }) => {
    await demo.seed()
    await demo.loginAsManager()

    // Starts on the tab, the video is shown next to it
    await page.goto(`/programs/${MASTER_PROGRAM.id}`)
    await page
      .getByRole('tab', { name: t('programOverviewPage:managePermissionsTab') })
      .click()

    await caption({
      fi: 'Koulutusohjelmalla voi olla useita vastaavia, jotka hallinnoivat sen tutkielmia ja asetuksia.',
      sv: 'Ett utbildningsprogram kan ha flera ansvariga som hanterar dess avhandlingar och inställningar.',
      en: 'A programme can have several managers, who manage its theses and settings.',
    })

    await caption({
      fi: 'Taulukossa ovat ohjelman nykyiset vastaavat.',
      sv: 'Tabellen visar programmets nuvarande ansvariga.',
      en: "The table lists the programme's current managers.",
    })
    const approval = page.getByTestId(
      `toggle-thesis-approver-button-${CO_MANAGER.id}`
    )
    await caption({
      fi: 'Vihreä kuvake tarkoittaa, että vastaava voi hyväksyä ohjelman tutkielmia. Kuvaketta klikkaamalla annat tai poistat oikeuden.',
      sv: 'En grön ikon betyder att den ansvariga kan godkänna programmets avhandlingar. Klicka på ikonen för att ge eller ta bort rätten.',
      en: 'A green icon means the manager can approve the programme’s theses. Click the icon to give or remove the right.',
    })
    await click(approval)
    await expect(approval).toHaveClass(/MuiIconButton-colorSuccess/)

    await caption({
      fi: 'Uusi vastaava lisätään hakemalla henkilö nimellä. Haku vaatii vähintään viisi merkkiä.',
      sv: 'En ny ansvarig läggs till genom att söka personen med namn. Sökningen kräver minst fem tecken.',
      en: 'To add a manager, search for the person by name. The search needs at least five characters.',
    })
    await fill(page.locator('#program-manager'), NEW_MANAGER.lastName)
    await click(
      page.getByRole('option', {
        name: new RegExp(`${NEW_MANAGER.firstName} ${NEW_MANAGER.lastName}`),
      })
    )

    await caption({
      fi: 'Valitse, saako uusi vastaava hyväksyä tutkielmia, ja tallenna.',
      sv: 'Välj om den nya ansvariga får godkänna avhandlingar och spara.',
      en: 'Choose whether the new manager may approve theses, and save.',
    })
    await hover(
      page.getByRole('switch', {
        name: t('manageEntityPermissions:allowThesisApprovalButton'),
      })
    )
    await click(page.getByTestId('add-program-management-button'))
    await expect(
      page.getByRole('cell', {
        name: new RegExp(`${NEW_MANAGER.lastName} ${NEW_MANAGER.firstName}`),
      })
    ).toBeVisible()

    await caption({
      fi: 'Opintosuuntien vastaavat näkevät vain oman opintosuuntansa tutkielmat. Heidät lisätään omalla välilehdellään samalla tavalla.',
      sv: 'Ansvariga för studieinriktningar ser bara sin egen inriktnings avhandlingar. De läggs till på samma sätt på en egen flik.',
      en: 'Study track managers only see the theses of their own track. They are added the same way on their own tab.',
    })
    await click(
      page.getByRole('tab', {
        name: t('manageEntityPermissions:studyTrackTitle'),
      })
    )
    await expect(
      page.getByRole('cell', {
        name: new RegExp(
          `${TRACK_MANAGER.lastName} ${TRACK_MANAGER.firstName}`
        ),
      })
    ).toBeVisible()
  }
)
