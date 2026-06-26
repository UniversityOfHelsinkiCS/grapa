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
    subject: 'Prethesis - Thesis status changed to IN PROGRESS',
    message: `
    This is an automated message from Prethesis. \n\n

    The status of the thesis "${updatedThesis.topic}" has been changed to IN PROGRESS by ${actionUser.firstName} ${actionUser.lastName}.
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
    subject: 'Prethesis - Tutkielma valmiina Ethesiskseen',
    message: `
    Seuraava tutkielma on valmiina siirrettäväksi Ethesikseen

    ${author.firstName} ${author.lastName} (${author.studentNumber})
    ${updatedThesis.topic}

    ${program?.name?.fi || program?.name?.en} ${studyTrack ? `(${studyTrack.name?.fi || studyTrack.name?.en})` : ''}

    Arvioijat:

    ${updatedThesis.graders
      .map(
        (grader) =>
          `${grader.isPrimaryGrader ? employeeTitlesPrimer.fi : employeeTitlesSecond.fi} ${grader.user.firstName} ${grader.user.lastName} (${grader.user.email}) ${grader.isPrimaryGrader ? 'ensisijainen' : ''}`
      )
      .join('\n    ')}

    <a href='https://prethesis.helsinki.fi/ethesis'>https://prethesis.helsinki.fi/ethesis</a>
  `,
  }
}

export const ethesisPermissionEmailTemplate = (
  updatedThesis: Thesis
): TemplateOutput => {
  return {
    subject: 'Prethesis - Permission to submit to E-thesis',
    message: `
    This is an automated message from Prethesis. \n\n

    You now have permission to submit your thesis "${updatedThesis.topic}" to E-thesis.
    Please submit your thesis directly to E-thesis. You can find the instructions here:
    <a href='https://studies.helsinki.fi/instructions/article/e-thesis'>https://studies.helsinki.fi/instructions/article/e-thesis</a>
  `,
  }
}

export const lastMilestoneReachedEmailTemplate = (
  updatedThesis: Thesis,
  actionUser: UserType
): TemplateOutput => {
  return {
    subject: 'Prethesis - Last milestone reached',
    message: `
    This is an automated message from Prethesis. \n\n

    The user ${actionUser.firstName} ${actionUser.lastName} has marked the last milestone as done for the thesis "${updatedThesis.topic}".
    Please go to Prethesis, mark the second grader, and give the student permission to send the thesis to E-thesis.
  `,
  }
}

export const newThesisToApproveEmailTemplate = (
  newThesis: ThesisData,
  actionUser: UserType
): TemplateOutput => {
  return {
    subject: 'Prethesis - A new thesis for you to approve',
    message: `
    This is an automated message from Prethesis. \n\n

    A new thesis "${newThesis.topic}" was created by ${actionUser.firstName} ${actionUser.lastName}.
    The author of the thesis is ${newThesis.authors[0].firstName} ${newThesis.authors[0].lastName}.
    You were marked as an approver for this thesis.
  `,
  }
}
