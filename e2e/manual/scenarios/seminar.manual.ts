import { SUPERVISORS } from '../../../src/server/test/manual/demoData'
import { expect, manualTest } from '../fixtures'
import {
  choosePerson,
  featureLabel,
  openNewThesisForm,
  openSettings,
  openSupervisedTheses,
  same,
  toggleFeature,
} from '../steps'

manualTest(
  'Seminaari',
  {
    annotation: [
      { type: 'en', description: 'Seminar' },
      { type: 'sv', description: 'Seminarium' },
      { type: 'setting', description: 'seminar' },
      { type: 'setting', description: 'allowMultipleSeminarResponsibles' },
    ],
  },
  async ({ page, demo, caption, click, hover, fill, curtain, t }) => {
    const steps = { page, click, hover, caption, t }
    await demo.seed()
    await demo.loginAsManager()
    await openSettings(page, t, featureLabel(page, t, 'seminar'))

    await toggleFeature(steps, 'seminar', {
      fi: 'Kun seminaari on päällä, jokaiselle tutkielmalle valitaan seminaariryhmän vetäjä.',
      sv: 'När seminariet är på väljs en seminariehandledare för varje avhandling.',
      en: 'With the seminar on, every thesis gets a seminar instructor.',
    })
    await toggleFeature(steps, 'allowMultipleSeminarResponsibles', {
      fi: 'Jos seminaariryhmällä voi olla useita vetäjiä, salli myös ne.',
      sv: 'Om seminariet kan ha flera ansvariga, tillåt även dem.',
      en: 'If a seminar group can have several instructors, allow them too.',
    })

    await curtain(same(t('navbar:supervisedTheses')), () =>
      openSupervisedTheses(page, t)
    )
    const form = await openNewThesisForm(steps)
    const seminar = form.getByRole('group', {
      name: t('thesisForm:seminarSupervisor'),
    })
    await hover(seminar.getByTestId('seminarSupervisor-select-input-1'))
    await caption({
      fi: 'Tutkielmalomakkeella on nyt pakollinen kohta seminaariryhmän vetäjälle.',
      sv: 'Avhandlingsblanketten har nu ett obligatoriskt fält för seminariehandledaren.',
      en: 'The thesis form now has a required field for the seminar instructor.',
    })
    await choosePerson(
      steps,
      fill,
      seminar
        .getByTestId('seminarSupervisor-select-input-1')
        .getByRole('combobox'),
      SUPERVISORS[0].lastName
    )

    await caption({
      fi: 'Koska useat vetäjät on sallittu, seminaariryhmän vetäjiä voi lisätä useamman.',
      sv: 'Eftersom flera ansvariga är tillåtna kan du lägga till flera seminariehandledare.',
      en: 'As several instructors are allowed, you can add more seminar instructors.',
    })
    await click(form.getByTestId('add-seminar-supervisor-button'))
    await click(page.getByTestId('add-seminar-supervisor-menu-item-internal'))
    await choosePerson(
      steps,
      fill,
      seminar
        .getByTestId('seminarSupervisor-select-input-2')
        .getByRole('combobox'),
      SUPERVISORS[1].lastName
    )
    await expect(
      seminar.getByTestId(/^seminarSupervisor-select-input-/)
    ).toHaveCount(2)
  }
)
