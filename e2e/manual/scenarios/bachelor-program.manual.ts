import {
  BACHELOR_PROGRAM,
  THESES,
} from '../../../src/server/test/manual/demoData'
import { expect, manualTest } from '../fixtures'
import { featureLabel, openSettings, openThesis } from '../steps'

const THESIS = THESES.find((thesis) => thesis.inBachelorProgram)!

manualTest(
  'Kandiohjelma',
  {
    annotation: [
      { type: 'en', description: "Bachelor's programme" },
      { type: 'sv', description: 'Kandidatprogram' },
      { type: 'setting', description: 'isBachelorProgram' },
      { type: 'setting', description: 'numberOfGraders' },
    ],
  },
  async ({ page, demo, caption, click, hover, curtain, lang, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    const bachelor = featureLabel(page, t, 'isBachelorProgram')
    await openSettings(page, t, bachelor, BACHELOR_PROGRAM.id)

    await hover(bachelor)
    await caption({
      fi: 'On kandiohjelma on päällä kandiohjelmissa. Se kertoo, että ohjelman tutkielmat ovat kandidaatintutkielmia.',
      sv: 'Är kandidatprogram är på i kandidatprogram. Den anger att programmets avhandlingar är kandidatuppsatser.',
      en: "Is Bachelor's Programme is on in Bachelor's programmes. It tells that the programme's theses are Bachelor's theses.",
    })

    const graders = page.locator('#number-of-graders-select')
    await hover(graders)
    await caption({
      fi: 'Kandidaatintutkielmalle riittää yksi arvioija.',
      sv: 'För en kandidatuppsats räcker det med en bedömare.',
      en: "A Bachelor's thesis needs only one grader.",
    })
    await click(graders)
    await hover(page.getByRole('option', { name: '1', exact: true }))
    await caption({
      fi: 'Siksi arvioijien enimmäismääräksi voi valita myös yhden. Maisteriohjelmassa vaihtoehdot ovat kaksi ja kolme.',
      sv: 'Därför kan det maximala antalet bedömare också vara en. I ett magisterprogram är alternativen två och tre.',
      en: "So the maximum number of graders can also be one. In a Master's programme, the options are two and three.",
    })
    // Choosing the current value closes the list without a change
    await click(page.getByRole('option', { name: '1', exact: true }))

    await curtain(
      {
        fi: 'Kandiohjelman tutkielmat',
        sv: 'Kandidatprogrammets avhandlingar',
        en: "The Bachelor's programme's theses",
      },
      async () => {
        await page.goto(`/programs/${BACHELOR_PROGRAM.id}`)
        await expect(
          page.getByText(THESIS.topic[lang], { exact: true }).first()
        ).toBeVisible()
      }
    )
    const thesis = await openThesis(steps, THESIS.topic[lang])

    await hover(
      thesis.getByText(t('viewThesisFooter:bachelorsThesis'), { exact: true })
    )
    await caption({
      fi: 'Tutkielmassa näkyy, että se on kandidaatintutkielma.',
      sv: 'Avhandlingen visar att den är en kandidatuppsats.',
      en: "The thesis shows that it's a Bachelor's thesis.",
    })

    await caption({
      fi: 'Jos lepotilan seuranta on käytössä, kandidaatintutkielma merkitään lepotilaan, kun se ei ole edennyt puoleen vuoteen. Maisterintutkielmalla raja on vuosi.',
      sv: 'Om vilolägesuppföljningen används markeras en kandidatuppsats som vilande när den inte har gått framåt på ett halvår. För en magisteravhandling är gränsen ett år.',
      en: "If idle state tracking is on, a Bachelor's thesis is marked as idle when it hasn't progressed in half a year. For a Master's thesis, the limit is a year.",
    })
    await expect(
      thesis.getByText(t('viewThesisFooter:missingGradersActionRequired'))
    ).toHaveCount(0)
  }
)
