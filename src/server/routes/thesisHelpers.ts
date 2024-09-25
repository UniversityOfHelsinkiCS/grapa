import { Includeable, Op, Transaction } from 'sequelize'
import { uniqBy } from 'lodash-es'
import { userFields } from './config'
import {
  Grader,
  Supervision,
  User,
  Attachment,
  ProgramManagement,
} from '../db/models'
import { ThesisData, User as UserType } from '../types'

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
    }
    includes = [...includes, teacherClause]

    const programIds = programManagement.map((pm) => pm.programId)

    whereClause = {
      [Op.or]: [
        // if a user is only a teacher (not admin nor supervisor),
        // they should only see theses they supervise
        { '$supervisionsForFiltering.user_id$': actionUser.id },
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
