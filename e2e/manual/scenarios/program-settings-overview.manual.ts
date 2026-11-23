import type { Locator } from '@playwright/test'

import { MASTER_PROGRAM } from '../../../src/server/test/manual/demoData'
import { type Caption, expect, manualTest } from '../fixtures'
import { featureSwitch, toggleFeature } from '../steps'

manualTest(
  'Koulutusohjelman asetukset',
  {
    annotation: [
      { type: 'en', description: 'Programme settings' },
      { type: 'sv', description: 'Programmets inställningar' },
    ],
  },
  async ({ page, demo, caption, click, hover, scrollTo, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()

    // Starts on the programme's page, the video is shown there. It opens on the Theses tab.
    await page.goto(`/programs/${MASTER_PROGRAM.id}`)
    const tab = (key: string) =>
      page.getByRole('tab', { name: t(key), exact: true })
    await hover(tab('theses'))
    await caption({
      fi: 'Koulutusohjelman sivulla seuraat ohjelmasi tutkielmia ja muokkaat sen asetuksia. Sivu avautuu Tutkielmat-välilehdelle, jossa ovat ohjelman tutkielmat.',
      sv: 'På utbildningsprogrammets sida följer du programmets avhandlingar och ändrar dess inställningar. Sidan öppnas på fliken Avhandlingar, som listar programmets avhandlingar.',
      en: "On the programme's page, you follow your programme's theses and change its settings. The page opens on the Theses tab, which lists the programme's theses.",
    })

    // Each tab is opened as it's described, so the captions don't depend on tab order
    const tabs: [string, Caption][] = [
      [
        'departmentOverviewPage:statisticsTab',
        {
          fi: 'Tilastoista näet, miten ohjelman tutkielmat etenevät ja pysyvätkö ne aikataulussa.',
          sv: 'Statistiken visar hur programmets avhandlingar framskrider och om de håller tidtabellen.',
          en: "Statistics show how the programme's theses progress and whether they're on schedule.",
        },
      ],
      [
        'departmentOverviewPage:supervisionsTab',
        {
          fi: 'Ohjauksista näet, montako tutkielmaa kukin ohjaaja ohjaa.',
          sv: 'Handledningar visar hur många avhandlingar varje handledare har.',
          en: 'Supervisions show how many theses each supervisor has.',
        },
      ],
      [
        'programOverviewPage:managePermissionsTab',
        {
          fi: 'Oikeuksien hallinnassa valitset ohjelman vastaavat.',
          sv: 'Under behörigheter väljer du programmets ansvariga.',
          en: 'In Manage permissions you choose the programme managers.',
        },
      ],
      [
        'eventLog:title',
        {
          fi: 'Tapahtumaloki kertoo, mitä ohjelman tutkielmille on tehty.',
          sv: 'Händelseloggen visar vad som har gjorts med programmets avhandlingar.',
          en: "The event log shows what has happened to the programme's theses.",
        },
      ],
      [
        'programOverviewPage:configurationsTab',
        {
          fi: 'Asetukset-välilehdellä ovat ohjelman asetukset. Ne vaikuttavat koko ohjelman tutkielmiin, joten ne avautuvat vasta varoituksen kuittaamisen jälkeen.',
          sv: 'Fliken Inställningar har programmets inställningar. De påverkar alla avhandlingar i programmet, så de öppnas först när du har kvitterat varningen.',
          en: "The Configurations tab has the programme's settings. They affect every thesis in the programme, so they open only after you've acknowledged the warning.",
        },
      ],
    ]
    for (const [key, text] of tabs) {
      await click(tab(key))
      await page.waitForLoadState('networkidle')
      await caption(text)
    }
    await click(page.getByTestId('acknowledge-configurations-warning'))

    // Each section is shown before it's described, so the captions don't depend on its position
    const heading = (key: string) =>
      page.getByRole('heading', { name: t(key), exact: true })
    const sections: [Locator, Caption][] = [
      [
        heading('programOverviewPage:milestones:title'),
        {
          fi: 'Etapeilla jaat tutkielman vaiheisiin.',
          sv: 'Med milstolpar delar du in avhandlingen i steg.',
          en: 'Milestones split a thesis into steps.',
        },
      ],
      [
        heading('programOverviewPage:targetDates:title'),
        {
          fi: 'Tavoitepäivät ovat valmiita vaihtoehtoja tutkielman tavoitepäiväksi.',
          sv: 'Måldatum är färdiga alternativ för avhandlingens måldatum.',
          en: "Target dates are ready options for a thesis's target date.",
        },
      ],
      [
        heading('programOverviewPage:combinedStudyTracks:title'),
        {
          fi: 'Samankaltaiset opintosuunnat voi yhdistää.',
          sv: 'Liknande studieinriktningar kan slås samman.',
          en: 'Similar study tracks can be combined.',
        },
      ],
      [
        heading('programOverviewPage:helperTexts'),
        {
          fi: 'Ohjetekstit näytetään tutkielmalomakkeella.',
          sv: 'Hjälptexterna visas på avhandlingsblanketten.',
          en: 'Helper texts are shown on the thesis form.',
        },
      ],
      [
        page.locator('#number-of-graders-select'),
        {
          fi: 'Täällä valitset myös, montako arvioijaa tutkielmalla voi olla.',
          sv: 'Här väljer du också hur många bedömare en avhandling kan ha.',
          en: 'Here you also choose how many graders a thesis can have.',
        },
      ],
      [
        heading('programOverviewPage:features'),
        {
          fi: 'Ominaisuudet kytketään päälle tai pois.',
          sv: 'Funktionerna slås på eller av.',
          en: 'Features are switched on or off.',
        },
      ],
    ]
    for (const [section, text] of sections) {
      await scrollTo(section)
      await caption(text)
    }

    await caption({
      fi: 'Viemällä kursorin ominaisuuden nimen päälle näet, mitä se tekee.',
      sv: 'Håll markören över en funktions namn för att se vad den gör.',
      en: "Point at a feature's name to see what it does.",
    })
    await toggleFeature(steps, 'showEventLogs', {
      fi: 'Jokainen muutos tallennetaan vasta, kun vahvistat sen.',
      sv: 'Varje ändring sparas först när du bekräftar den.',
      en: 'Every change is saved only after you confirm it.',
    })
    await caption({
      fi: 'Muutos koskee heti kaikkia ohjelman tutkielmia.',
      sv: 'Ändringen gäller genast alla avhandlingar i programmet.',
      en: 'The change applies right away to every thesis in the programme.',
    })
    await expect(featureSwitch(page, t, 'showEventLogs')).toBeChecked()
  }
)
