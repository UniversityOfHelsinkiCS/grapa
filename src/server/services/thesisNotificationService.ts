import { Op } from 'sequelize'
import { uniq } from 'lodash-es'
import dayjs from 'dayjs'
import logger from '../util/logger'
import sendEmail from '../mailer/pate'
import { User, Thesis, Program, StudyTrack, EthesisAdmin } from '../db/models'
import { ThesisData, User as UserType } from '../types'
import { getEmployeeTitles, titlesGraderGroup } from './thesisHelpers'
import { getMilestoneCount } from '../../shared/utils/thesisUtils'
import {
  inProgressEmailTemplate,
  ethesisSentEmailTemplate,
  ethesisPermissionEmailTemplate,
  lastMilestoneReachedEmailTemplate,
  newThesisToApproveEmailTemplate,
  waysOfWorkingExpiringEmailTemplate,
  waysOfWorkingExpiredEmailTemplate,
  suggestionRejectedEmailTemplate,
  suggestionSentEmailTemplate,
  lastMilestoneReachedReminderEmailTemplate,
} from '../templates/thesisEmail'
import {
  findThesesByExpirationDates,
  findThesesForMilestoneReminders,
} from './thesisService'

const getSupervisorEmails = (thesis: Thesis): string[] =>
  (thesis.supervisions ?? [])
    .map((s) => s.user)
    .filter((user) => user && !user.isExternal && user.email)
    .map((user) => user.email as string)

const getSeminarSupervisorEmails = (thesis: Thesis): string[] =>
  (thesis.seminarSupervisions ?? [])
    .map((ss) => ss.user)
    .filter((user) => user && !user.isExternal && user.email)
    .map((user) => user.email as string)

const getAuthorEmails = (thesis: Thesis): string[] =>
  (thesis.authors ?? [])
    .filter((user) => user?.email)
    .map((user) => user.email as string)

const getGraderEmails = (thesis: Thesis): string[] =>
  (thesis.graders ?? [])
    .map((g) => g.user)
    .filter((user) => user && !user.isExternal && user.email)
    .map((user) => user.email as string)

export const handleStatusChangeEmail = async (
  originalThesis: Thesis,
  updatedThesis: Thesis,
  actionUser: UserType,
  customMessage?: string
) => {
  const supervisorEmails = uniq(getSupervisorEmails(updatedThesis))
  const authorEmails = uniq(getAuthorEmails(updatedThesis))
  const seminarSupervisorEmails = uniq(
    getSeminarSupervisorEmails(updatedThesis)
  )

  if (
    originalThesis.status === 'PLANNING' &&
    updatedThesis.status === 'IN_PROGRESS'
  ) {
    const targets = uniq([
      ...supervisorEmails,
      ...authorEmails,
      ...seminarSupervisorEmails,
    ])

    const { subject, message } = inProgressEmailTemplate(
      updatedThesis,
      actionUser
    )
    await sendEmail(targets, message, subject)
  } else if (
    originalThesis.status === 'SUGGESTED' &&
    updatedThesis.status === 'DRAFT'
  ) {
    const targets = uniq([...authorEmails])

    const { subject, message } = suggestionRejectedEmailTemplate(
      updatedThesis,
      actionUser,
      customMessage
    )
    await sendEmail(targets, message, subject)
  } else if (
    originalThesis.status === 'DRAFT' &&
    updatedThesis.status === 'SUGGESTED'
  ) {
    const targets = uniq([...supervisorEmails])

    const { subject, message } = suggestionSentEmailTemplate(
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

  if (
    options?.useMilestones &&
    originalThesis.milestone !== updatedThesis.milestone &&
    updatedThesis.milestone != null &&
    updatedThesis.milestone ===
      getMilestoneCount(options, updatedThesis.milestoneVersion)
  ) {
    const targets = uniq([...supervisorEmails, ...seminarSupervisorEmails])

    const { subject, message } = lastMilestoneReachedEmailTemplate(
      updatedThesis,
      actionUser
    )
    await sendEmail(targets, message, subject)
  }
}

export const handleThesisToApproveEmail = async (
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

const collectWaysOfWorkingEmails = (thesis: Thesis): string[] => {
  return uniq([
    ...getAuthorEmails(thesis),
    ...getSupervisorEmails(thesis),
    ...getGraderEmails(thesis),
    ...getSeminarSupervisorEmails(thesis),
  ])
}

const sendWaysOfWorkingEmails = async () => {
  const today = new Date()
  const twoMonthsFromNow = dayjs(today).add(2, 'month').toDate()

  const [thesesExpiringToday, thesesExpiringInTwoMonths] = await Promise.all([
    findThesesByExpirationDates([today]),
    findThesesByExpirationDates([twoMonthsFromNow]),
  ])

  for (const thesis of thesesExpiringToday) {
    try {
      const targets = collectWaysOfWorkingEmails(thesis)
      if (!targets.length) continue
      const { subject, message } = waysOfWorkingExpiredEmailTemplate(
        thesis.topic
      )
      await sendEmail(targets, message, subject)
    } catch (err) {
      logger.error(`Error sending expired email for thesis ${thesis.id}:`, err)
    }
  }

  for (const thesis of thesesExpiringInTwoMonths) {
    try {
      const targets = collectWaysOfWorkingEmails(thesis)
      if (!targets.length) continue
      const { subject, message } = waysOfWorkingExpiringEmailTemplate(
        thesis.topic
      )
      await sendEmail(targets, message, subject)
    } catch (err) {
      logger.error(`Error sending expiring email for thesis ${thesis.id}:`, err)
    }
  }
}

const sendLastMilestoneReminderEmails = async () => {
  const today = new Date()
  const oneWeekAgo = dayjs(today).subtract(1, 'week').toDate()
  const twoWeeksAgo = dayjs(today).subtract(2, 'week').toDate()

  const thesesForReminders = await findThesesForMilestoneReminders([
    oneWeekAgo,
    twoWeeksAgo,
  ])

  for (const thesis of thesesForReminders) {
    try {
      const isBachelor = thesis.program?.options?.isBachelorProgram === true
      const requiredGraders = isBachelor ? 1 : 2
      const currentGraders = thesis.graders?.length ?? 0

      if (currentGraders >= requiredGraders) continue

      const supervisorEmails = getSupervisorEmails(thesis)
      const seminarSupervisorEmails = getSeminarSupervisorEmails(thesis)

      const targets = uniq([...supervisorEmails, ...seminarSupervisorEmails])

      if (!targets.length) continue

      const author = thesis.authors?.[0]
      const { subject, message } = lastMilestoneReachedReminderEmailTemplate(
        thesis,
        author
      )
      await sendEmail(targets, message, subject)
    } catch (err) {
      logger.error(
        `Error sending milestone reminder email for thesis ${thesis.id}:`,
        err
      )
    }
  }
}

export const sendScheduledEmails = async () => {
  try {
    await sendWaysOfWorkingEmails()
    await sendLastMilestoneReminderEmails()
  } catch (error) {
    logger.error('Error running sendScheduledEmails cron job:', error)
  }
}
