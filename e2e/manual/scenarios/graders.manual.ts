import { BACHELOR_PROGRAM } from '../../../src/server/test/manual/demoData'
import { expect, manualTest } from '../fixtures'
import { featureLabel, openSettings } from '../steps'

manualTest(
  'Arvioijat',
  {
    annotation: [
      { type: 'en', description: 'Graders' },
      { type: 'sv', description: 'Bedömare' },
      { type: 'setting', description: 'numberOfGraders' },
      { type: 'setting', description: 'isBachelorProgram' },
    ],
  },
  async ({ page, demo, caption, click, hover, curtain, t }) => {
    await demo.seed()
    await demo.loginAsManager()
    const graders = page.locator('#number-of-graders-select')
    await openSettings(page, t, graders)

    await hover(graders)
    await caption({
      fi: 'Arvioijien enimmäismäärä rajaa, montako arvioijaa tutkielmalle voi lisätä.',
      sv: 'Det maximala antalet bedömare begränsar hur många bedömare en avhandling kan ha.',
      en: 'The maximum number of graders limits how many graders a thesis can have.',
    })
    await click(graders)
    await hover(page.getByRole('option', { name: '3', exact: true }))
    await caption({
      fi: 'Maisteriohjelmassa vaihtoehdot ovat kaksi ja kolme. Oletus on kaksi.',
      sv: 'I ett magisterprogram är alternativen två och tre. Standard är två.',
      en: "In a Master's programme, the options are two and three. The default is two.",
    })
    // Choosing the current value closes the list without a change
    await click(page.getByRole('option', { name: '2', exact: true }))

    const bachelor = featureLabel(page, t, 'isBachelorProgram')
    await curtain(
      {
        fi: 'Kandiohjelman asetukset',
        sv: 'Kandidatprogrammets inställningar',
        en: "The Bachelor's programme's settings",
      },
      () => openSettings(page, t, bachelor, BACHELOR_PROGRAM.id)
    )
    await hover(bachelor)
    await caption({
      fi: 'Kandiohjelmassa On kandiohjelma -asetus on päällä. Silloin arvioijia voi olla myös vain yksi, ja yksi arvioija riittää E-thesikseen lähettämiseen. Maisteriohjelmassa siihen tarvitaan kaksi.',
      sv: 'I ett kandidatprogram är Är kandidatprogram på. Då kan det också finnas bara en bedömare, och en bedömare räcker för att skicka avhandlingen till E-thesis. I ett magisterprogram behövs två.',
      en: "In a Bachelor's programme, Is Bachelor's Programme is on. Then a thesis can have just one grader, and one is enough for submitting it to E-thesis. A Master's programme needs two.",
    })
    await hover(graders)
    await expect(graders).toHaveText('1')
  }
)
