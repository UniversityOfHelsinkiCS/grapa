import { Op } from 'sequelize'
import { uniq } from 'lodash-es'
import sendEmail from '../mailer/pate'
import { User, Thesis, Program, StudyTrack, EthesisAdmin } from '../db/models'
import { ThesisData, User as UserType } from '../types'
import { getEmployeeTitles, titlesGraderGroup } from './thesisHelpers'
import {
  inProgressEmailTemplate,
  ethesisSentEmailTemplate,
  ethesisPermissionEmailTemplate,
  lastMilestoneReachedEmailTemplate,
  newThesisToApproveEmailTemplate,
} from '../templates/thesisEmail'

export const handleStatusChangeEmail = async (
  originalThesis: Thesis,
  updatedThesis: Thesis,
  actionUser: UserType
) => {
  const supervisorEmails = uniq(
    (updatedThesis.supervisions || [])
      .map((person) => person?.user)
      .filter((user) => user && !user.isExternal && user.email)
      .map((user) => user.email)
  )

  const authorEmails = uniq(
    (updatedThesis.authors || [])
      .filter((user) => user?.email)
      .map((user) => user.email)
  )

  if (
    originalThesis.status === 'PLANNING' &&
    updatedThesis.status === 'IN_PROGRESS'
  ) {
    const targets = uniq([...supervisorEmails, ...authorEmails])

    const { subject, message } = inProgressEmailTemplate(
      updatedThesis,
      actionUser
    )
    await sendEmail(targets, message, subject)
  } else if (
    originalThesis.status === 'IN_PROGRESS' &&
    updatedThesis.status === 'ETHESIS_SENT'
  ) {
    const author = updatedThesis.authors[0]
    const program = await Program.findByPk(updatedThesis.programId)
    const studyTrack = await StudyTrack.findByPk(updatedThesis.studyTrackId)

    const employeeTitlesPrimer = (
      await getEmployeeTitles(
        updatedThesis.graders.filter((g) => g.isPrimaryGrader)[0]?.user.username
      )
    )?.titles.filter((title) =>
      titlesGraderGroup.includes(title.en.toLowerCase())
    )[0] ?? {
      fi: '',
    }

    const getSecondaryEmployeeTitle = async () => {
      if (updatedThesis.graders.some((grader) => grader.user.isExternal)) {
        return { fi: '' }
      }

      return (
        (
          await getEmployeeTitles(
            updatedThesis.graders.filter((g) => !g.isPrimaryGrader)[0]?.user
              .username
          )
        )?.titles.filter((title) =>
          titlesGraderGroup.includes(title.en.toLowerCase())
        )[0] ?? {
          fi: '',
        }
      )
    }

    const employeeTitlesSecond = await getSecondaryEmployeeTitle()

    const { subject, message } = ethesisSentEmailTemplate(
      updatedThesis,
      author,
      program,
      studyTrack,
      employeeTitlesPrimer,
      employeeTitlesSecond
    )

    const targets = ['matti.luukkainen@helsinki.fi']

    const ethesisAdmins = await EthesisAdmin.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email'],
          required: true,
          on: {
            id: { [Op.col]: 'EthesisAdmin.user_id' },
          },
        },
      ],
    })

    const ethesisAdminEmails = ethesisAdmins
      .filter((admin) => (admin as any).user?.email)
      .map((admin) => (admin as any).user.email)

    targets.push(...ethesisAdminEmails)
    await sendEmail(targets, message, subject)
  } else if (
    originalThesis.status !== 'ETHESIS' &&
    updatedThesis.status === 'ETHESIS'
  ) {
    const options = (updatedThesis as any).program?.options
    if (options?.allowStudentStartedProcess) {
      const targets = authorEmails

      const { subject, message } = ethesisPermissionEmailTemplate(updatedThesis)
      await sendEmail(targets, message, subject)
    }
  }

  const options = (updatedThesis as any).program?.options
  const versions = options?.milestones?.versions

  if (
    options?.useMilestones &&
    originalThesis.milestone !== updatedThesis.milestone &&
    updatedThesis.milestone ===
      versions?.at(updatedThesis.milestoneVersion ?? -1)?.length
  ) {
    const targets = supervisorEmails

    const { subject, message } = lastMilestoneReachedEmailTemplate(
      updatedThesis,
      actionUser
    )
    await sendEmail(targets, message, subject)
  }
}

export const handleThesisCreationEmail = async (
  newThesis: ThesisData,
  actionUser: UserType
) => {
  if (newThesis.approvers?.length) {
    const approverTargets = newThesis.approvers
      .filter((approver) => approver.email)
      .map((approver) => approver.email)

    const targets = uniq([...approverTargets])

    const { subject, message } = newThesisToApproveEmailTemplate(
      newThesis,
      actionUser
    )

    await sendEmail(targets, message, subject)
  }
}
