import { Includeable, Op, Transaction } from 'sequelize'
import { uniq, uniqBy } from 'lodash-es'
import { userFields } from './config'
import {
  Grader,
  Supervision,
  User,
  Attachment,
  ProgramManagement,
  EventLog,
  Thesis,
} from '../db/models'
import { ThesisData, User as UserType } from '../types'
import sendEmail from '../mailer/pate'

interface FetchThesisProps {
  thesisId?: string
  actionUser: UserType
  onlySupervised?: boolean
}
export const getFindThesesOptions = async ({
  thesisId,
  actionUser,
  onlySupervised,
}: FetchThesisProps) => {
  let includes: Includeable[] = [
    {
      model: Supervision,
      as: 'supervisions',
      attributes: ['percentage', 'isPrimarySupervisor'],
      separate: true,
      include: [
        {
          model: User,
          as: 'user',
          attributes: userFields,
        },
      ],
    },
    {
      model: Grader,
      as: 'graders',
      attributes: ['isPrimaryGrader'],
      separate: true,
      include: [
        {
          model: User,
          as: 'user',
          attributes: userFields,
        },
      ],
    },
    {
      model: User,
      as: 'authors',
      attributes: userFields,
    },
    {
      model: User,
      as: 'approvers',
      attributes: userFields,
    },
    {
      model: Attachment,
      as: 'researchPlan',
      attributes: ['filename', ['original_name', 'name'], 'mimetype'],
      where: { label: 'researchPlan' },
      required: false,
    },
    {
      model: Attachment,
      as: 'waysOfWorking',
      attributes: ['filename', ['original_name', 'name'], 'mimetype'],
      where: { label: 'waysOfWorking' },
      required: false,
    },
  ]

  let whereClause: Record<any, any> = thesisId ? { id: thesisId } : {}
  if (!actionUser.isAdmin || onlySupervised) {
    const programManagement = onlySupervised
      ? []
      : await ProgramManagement.findAll({
          attributes: ['programId'],
          where: { userId: actionUser.id },
        })

    // We want to include theses where current user is a supervisor
    // but for the returned theses, we still want to include all
    // supervisions.
    // To achieve this, we use 2 Supervision includes, one above
    // with attribute listed and one below with no attributes.
    // The only purpose of this include is to be used in filtering.
    const teacherClause: Includeable = {
      model: Supervision,
      as: 'supervisionsForFiltering',
      attributes: [] as const,
      where: {
        userId: actionUser.id,
      },
      required: false,
    }
    includes = [...includes, teacherClause]

    const programIds = programManagement.map((pm) => pm.programId)

    whereClause = {
      [Op.or]: [
        // if a user is only a teacher (not admin nor supervisor),
        // they should only see theses they supervise
        { '$supervisionsForFiltering.user_id$': actionUser.id },
        { '$approvers.Approver.user_id$': actionUser.id },
        // but we also want to show all theses within programs
        // managed by the user
        programIds?.length ? { programId: programIds } : {},
      ],
    }
  }

  return {
    where: whereClause,
    attributes: [
      'id',
      'topic',
      'status',
      'startDate',
      'targetDate',
      'programId',
      'studyTrackId',
    ],
    include: includes,
  }
}

export const getAndCreateExtUsers = async (
  thesisData: ThesisData,
  transaction: Transaction
) => {
  const gradersAndSupervisors = [
    ...thesisData.supervisions,
    ...thesisData.graders,
  ]

  const nonDuplicateGradersAndSupervisors = uniqBy(
    gradersAndSupervisors,
    (x) => x.user?.email
  )

  // Create the external users from the graders and supervisions
  const extUsers = await User.bulkCreate(
    nonDuplicateGradersAndSupervisors
      .filter((person) => person.isExternal)
      .map((person) => ({
        username: `ext-${person.user?.email}`,
        firstName: person.user?.firstName,
        lastName: person.user?.lastName,
        email: person.user?.email,
        affiliation: person.user?.affiliation,
        isExternal: true,
      })),
    {
      transaction,
      updateOnDuplicate: [
        'username',
        'firstName',
        'lastName',
        'email',
        'affiliation',
      ],
      validate: true,
    }
  )

  return extUsers
}

export const handleStatusChangeEmail = async (
  originalThesis: Thesis,
  updatedThesis: Thesis,
  actionUser: UserType
) => {
  if (
    originalThesis.status === 'PLANNING' &&
    updatedThesis.status === 'IN_PROGRESS'
  ) {
    const supervisorTargets = updatedThesis.supervisions
      .map((person) => person.user)
      .filter((person) => !person.isExternal)

    const targets = uniq(
      [...supervisorTargets, ...updatedThesis.authors]
        .filter((person) => person.email)
        .map((person) => person.email)
    )

    const subject = 'Prethesis - Thesis status changed to IN PROGRESS'
    const message = `
    This is an automated message from Prethesis. \n\n

    The status of the thesis "${updatedThesis.topic}" has been changed to IN PROGRESS by ${actionUser.firstName} ${actionUser.lastName}.
  `

    await sendEmail(targets, message, subject)
  }
}

export const handleStatusChangeEventLog = async (
  originalThesis: Thesis,
  updatedThesis: Thesis,
  actionUser: UserType,
  transaction: Transaction
) => {
  if (originalThesis.status !== updatedThesis.status) {
    await EventLog.create(
      {
        userId: actionUser.id,
        thesisId: originalThesis.id,
        type: 'THESIS_STATUS_CHANGED',
        data: {
          from: originalThesis.status,
          to: updatedThesis.status,
        },
      },
      { transaction }
    )
  }
}

export const handleGradersChangeEventLog = async (
  originalThesis: Thesis,
  updatedThesis: Thesis,
  actionUser: UserType,
  transaction: Transaction
) => {
  const originalGraders = originalThesis.graders
  const updatedGraders = updatedThesis.graders

  const removedGraders = originalGraders.filter(
    (originalGrader) =>
      !updatedGraders.some(
        (updatedGrader) =>
          updatedGrader.user?.email === originalGrader.user.email
      )
  )

  const addedGraders = updatedGraders.filter(
    (updatedGrader) =>
      !originalGraders.some(
        (originalGrader) =>
          originalGrader.user.email === updatedGrader.user?.email
      )
  )

  const changedGraders = originalGraders.filter((originalGrader) => {
    const updatedGrader = updatedGraders.find(
      (grader) => grader.user?.email === originalGrader.user.email
    )
    return updatedGrader?.isPrimaryGrader !== originalGrader.isPrimaryGrader
  })

  if (removedGraders.length || addedGraders.length || changedGraders.length) {
    await EventLog.create(
      {
        userId: actionUser.id,
        thesisId: originalThesis.id,
        type: 'THESIS_GRADERS_CHANGED',
        data: {
          originalGraders: originalThesis.graders,
          updatedGraders: updatedThesis.graders,
        },
      },
      { transaction }
    )
  }
}

export const handleSupervisionsChangeEventLog = async (
  originalThesis: Thesis,
  updatedThesis: Thesis,
  actionUser: UserType,
  transaction: Transaction
) => {
  const originalSupervisions = originalThesis.supervisions
  const updatedSupervisions = updatedThesis.supervisions

  const removedSupervisions = originalSupervisions.filter(
    (originalSupervision) =>
      !updatedSupervisions.some(
        (updatedSupervision) =>
          updatedSupervision.user?.email === originalSupervision.user.email
      )
  )

  const addedSupervisions = updatedSupervisions.filter(
    (updatedSupervision) =>
      !originalSupervisions.some(
        (originalSupervision) =>
          originalSupervision.user.email === updatedSupervision.user?.email
      )
  )

  const changedSupervisions = originalSupervisions.filter(
    (originalSupervision) => {
      const updatedSupervision = updatedSupervisions.find(
        (supervision) =>
          supervision.user?.email === originalSupervision.user.email
      )
      return (
        updatedSupervision?.isPrimarySupervisor !==
          originalSupervision.isPrimarySupervisor ||
        updatedSupervision?.percentage !== originalSupervision.percentage
      )
    }
  )

  if (
    removedSupervisions.length ||
    addedSupervisions.length ||
    changedSupervisions.length
  ) {
    await EventLog.create(
      {
        userId: actionUser.id,
        thesisId: originalThesis.id,
        type: 'THESIS_SUPERVISIONS_CHANGED',
        data: {
          originalSupervisions: originalThesis.supervisions,
          updatedSupervisions: updatedThesis.supervisions,
        },
      },
      { transaction }
    )
  }
}
