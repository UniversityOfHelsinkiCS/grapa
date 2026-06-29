import { Thesis, Program, StudyTrack } from '../db/models'
import { ThesisData, User as UserType } from '../types'

interface TemplateOutput {
  subject: string
  message: string
}

export const inProgressEmailTemplate = (
  updatedThesis: Thesis,
  actionUser: UserType
): TemplateOutput => {
  return {
    subject:
      'Prethesis - Tutkielman tila muutettu: KÄYNNISSÄ / Thesis status changed to IN PROGRESS / Avhandlingens status ändrad: PÅGÅR',
    message: `
Tämä on automaattinen viesti Prethesiksestä.

Käyttäjä ${actionUser.firstName} ${actionUser.lastName} on muuttanut tutkielman "${updatedThesis.topic}" tilaksi KÄYNNISSÄ.
---
This is an automated message from Prethesis.

The status of the thesis "${updatedThesis.topic}" has been changed to IN PROGRESS by ${actionUser.firstName} ${actionUser.lastName}.
---
Detta är ett automatiskt meddelande från Prethesis.

Statusen för avhandlingen "${updatedThesis.topic}" har ändrats till PÅGÅR av ${actionUser.firstName} ${actionUser.lastName}.
  `,
  }
}

export const ethesisSentEmailTemplate = (
  updatedThesis: Thesis,
  author: UserType,
  program: Program | null,
  studyTrack: StudyTrack | null,
  employeeTitlesPrimer: { fi: string },
  employeeTitlesSecond: { fi: string }
): TemplateOutput => {
  return {
    subject:
      'Prethesis - Tutkielma valmiina Ethesikseen / Thesis ready for E-thesis / Avhandling redo för E-thesis',
    message: `
Seuraava tutkielma on valmiina siirrettäväksi Ethesikseen:
The following thesis is ready to be transferred to E-thesis:
Följande avhandling är redo att överföras till E-thesis:

${author.firstName} ${author.lastName} (${author.studentNumber})
${updatedThesis.topic}

FI: ${program?.name?.fi || program?.name?.en} ${studyTrack ? `(${studyTrack.name?.fi || studyTrack.name?.en})` : ''}
EN: ${program?.name?.en || program?.name?.fi} ${studyTrack ? `(${studyTrack.name?.en || studyTrack.name?.fi})` : ''}
SV: ${program?.name?.sv || program?.name?.en} ${studyTrack ? `(${studyTrack.name?.sv || studyTrack.name?.en})` : ''}

Arvioijat / Graders / Bedömare:

${updatedThesis.graders
  .map(
    (grader) =>
      `${grader.isPrimaryGrader ? employeeTitlesPrimer.fi : employeeTitlesSecond.fi} ${grader.user.firstName} ${grader.user.lastName} (${grader.user.email}) ${grader.isPrimaryGrader ? '(ensisijainen / primary / primär)' : ''}`
  )
  .join('\n')}

<a href='https://prethesis.helsinki.fi/ethesis'>https://prethesis.helsinki.fi/ethesis</a>
  `,
  }
}

export const ethesisPermissionEmailTemplate = (
  updatedThesis: Thesis
): TemplateOutput => {
  return {
    subject:
      'Prethesis - Lupa lähettää E-thesikseen / Permission to submit to E-thesis / Tillstånd att skicka in till E-thesis',
    message: `
Tämä on automaattinen viesti Prethesiksestä.

Sinulla on nyt lupa lähettää tutkielmasi "${updatedThesis.topic}" E-thesikseen.
Ole hyvä ja lähetä tutkielmasi suoraan E-thesikseen. Löydät ohjeet täältä:
<a href='https://studies.helsinki.fi/ohjeet/artikkeli/e-thesis'>https://studies.helsinki.fi/ohjeet/artikkeli/e-thesis</a>
---
This is an automated message from Prethesis.

You now have permission to submit your thesis "${updatedThesis.topic}" to E-thesis.
Please submit your thesis directly to E-thesis. You can find the instructions here:
<a href='https://studies.helsinki.fi/instructions/article/e-thesis'>https://studies.helsinki.fi/instructions/article/e-thesis</a>
---
Detta är ett automatiskt meddelande från Prethesis.

Du har nu tillåtelse att skicka in din avhandling "${updatedThesis.topic}" till E-thesis.
Vänligen skicka in din avhandling direkt till E-thesis. Du hittar instruktionerna här:
<a href='https://studies.helsinki.fi/instruktioner/artikel/e-thesis'>https://studies.helsinki.fi/instruktioner/artikel/e-thesis</a>
  `,
  }
}

export const lastMilestoneReachedEmailTemplate = (
  updatedThesis: Thesis,
  actionUser: UserType
): TemplateOutput => {
  return {
    subject:
      'Prethesis - Viimeinen etappi saavutettu / Last milestone reached / Sista milstolpen nådd',
    message: `
Tämä on automaattinen viesti Prethesiksestä.

Käyttäjä ${actionUser.firstName} ${actionUser.lastName} on merkinnyt viimeisen etapin suoritetuksi tutkielmalle "${updatedThesis.topic}".
Ole hyvä ja mene Prethesikseen, merkitse toinen arvioija ja anna opiskelijalle lupa lähettää tutkielma E-thesikseen.
---
This is an automated message from Prethesis.

The user ${actionUser.firstName} ${actionUser.lastName} has marked the last milestone as done for the thesis "${updatedThesis.topic}".
Please go to Prethesis, mark the second grader, and give the student permission to send the thesis to E-thesis.
---
Detta är ett automatiskt meddelande från Prethesis.

Användaren ${actionUser.firstName} ${actionUser.lastName} har markerat den sista milstolpen som klar för avhandlingen "${updatedThesis.topic}".
Vänligen gå till Prethesis, markera den andra bedömaren och ge studenten tillåtelse att skicka in avhandlingen till E-thesis.
  `,
  }
}

export const newThesisToApproveEmailTemplate = (
  newThesis: ThesisData,
  actionUser: UserType
): TemplateOutput => {
  return {
    subject:
      'Prethesis - Uusi tutkielma hyväksyttäväksi / A new thesis to approve / En ny avhandling att godkänna',
    message: `
Tämä on automaattinen viesti Prethesiksestä.

Käyttäjä ${actionUser.firstName} ${actionUser.lastName} loi uuden tutkielman "${newThesis.topic}".
Tutkielman tekijä on ${newThesis.authors[0].firstName} ${newThesis.authors[0].lastName}.
Sinut on merkitty tutkielman hyväksyjäksi.
---
This is an automated message from Prethesis.

A new thesis "${newThesis.topic}" was created by ${actionUser.firstName} ${actionUser.lastName}.
The author of the thesis is ${newThesis.authors[0].firstName} ${newThesis.authors[0].lastName}.
You were marked as an approver for this thesis.
---
Detta är ett automatiskt meddelande från Prethesis.

En ny avhandling "${newThesis.topic}" skapades av ${actionUser.firstName} ${actionUser.lastName}.
Författaren till avhandlingen är ${newThesis.authors[0].firstName} ${newThesis.authors[0].lastName}.
Du markerades som godkännare för denna avhandling.
  `,
  }
}

export const waysOfWorkingExpiringEmailTemplate = (
  topic: string
): TemplateOutput => ({
  subject:
    'Prethesis - Ohjaussopimus vanhenee pian / Supervision agreement expiring soon / Handledningsavtalet löper ut snart',
  message: `
Tämä on automaattinen viesti Prethesiksestä.

Ohjaussopimus tutkielmalle "${topic}" vanhenee kahden kuukauden kuluttua.
Ole hyvä ja uusi sopimus tarvittaessa.
---
This is an automated message from Prethesis.

The supervision agreement for the thesis "${topic}" will expire in two months.
Please renew the agreement if necessary.
---
Detta är ett automatiskt meddelande från Prethesis.

Handledningsavtalet för avhandlingen "${topic}" löper ut om två månader.
Vänligen förnya avtalet vid behov.
  `,
})

export const waysOfWorkingExpiredEmailTemplate = (
  topic: string
): TemplateOutput => ({
  subject:
    'Prethesis - Ohjaussopimus vanhenee tänään / Supervision agreement expires today / Handledningsavtalet löper ut idag',
  message: `
Tämä on automaattinen viesti Prethesiksestä.

Ohjaussopimus tutkielmalle "${topic}" vanhenee tänään.
Ole hyvä ja uusi sopimus tarvittaessa.
---
This is an automated message from Prethesis.

The supervision agreement for the thesis "${topic}" expires today.
Please renew the agreement if necessary.
---
Detta är ett automatiskt meddelande från Prethesis.

Handledningsavtalet för avhandlingen "${topic}" löper ut idag.
Vänligen förnya avtalet vid behov.
  `,
})
