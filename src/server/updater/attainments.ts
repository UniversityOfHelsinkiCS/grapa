import { ThesisData } from '@backend/types'
import { Op } from 'sequelize'
import { Thesis, User } from '../db/models'
import { mangleData } from './mangleData'
import logger from '../util/logger'
import { sequelize } from '../db/connection'
import { handleStatusChangeEventLog } from '../routes/thesisHelpers'

interface AttainmentData {
  id: string
  personId: string
  courseUnitId: string
  state: 'ATTAINED'
  attainmentDate: string
  registrationDate: string
  courseUnit: {
    id: string
    code: string
  }
}

const unfinishedTheses = (await Thesis.findAll({
  where: {
    status: { [Op.notIn]: ['COMPLETED', 'CANCELLED'] },
  },
  include: [
    {
      model: User,
      as: 'authors',
      attributes: ['id', 'firstName', 'lastName'],
    },
  ],
})) as unknown as Omit<ThesisData[], 'supervisions' | 'graders'>

const attainmentsHandler = async (attainments: AttainmentData[]) => {
  const personIdsFromAttainments = attainments.map(
    (attainment) => attainment.personId
  )

  // Update each thesis where personId is found in the list of personIdsFromAttainments
  // with the status "COMPLETED" and the targetDate set to the attainmentDate.
  await Promise.all(
    unfinishedTheses.map(async (thesis) => {
      if (
        thesis.authors.some((author) =>
          personIdsFromAttainments.includes(author.id)
        )
      ) {
        logger.info(`Updating thesis ${thesis.id} to COMPLETED`)

        await sequelize.transaction(async (t) => {
          const initialThesis = await Thesis.findByPk(thesis.id, {
            transaction: t,
          })

          await Thesis.update(
            {
              status: 'COMPLETED',
              targetDate: attainments.find(
                (attainment) => attainment.personId === thesis.authors[0].id
              )?.attainmentDate,
            },
            {
              where: {
                id: thesis.id,
              },
              transaction: t,
            }
          )

          const updatedThesis = await Thesis.findByPk(thesis.id, {
            transaction: t,
          })

          await handleStatusChangeEventLog(
            initialThesis as Thesis,
            updatedThesis as Thesis,
            null, // No user for the system automation
            t
          )
        })
      }
    })
  )
}

const isNumber = (value: any) => !Number.isNaN(parseInt(value, 10))

// Taken from Norppa
const normalizeOrganisationCode = (r: string) => {
  if (r.startsWith('T')) {
    return r.replace('T', '7')
  }
  if (!r.includes('_')) {
    return r
  }

  const [left, right] = r.split('_')
  const prefix = [...left].filter(isNumber).join('')
  const suffix = `${left[0]}${right}`
  const providercode = `${prefix}0-${suffix}`
  return providercode
}

export const fetchThesesAttainments = async () => {
  const personIdsPerOrganisation = unfinishedTheses.reduce(
    (acc, thesis) => {
      const organisationCode = normalizeOrganisationCode(thesis.programId)
      const personIds = thesis.authors.map((author) => author.id)
      acc[organisationCode] = acc[organisationCode]
        ? [...acc[organisationCode], ...personIds]
        : personIds
      return acc
    },
    {} as Record<string, string[]>
  )

  for (const [orgCode, personIds] of Object.entries(personIdsPerOrganisation)) {
    await mangleData({
      url: `masters-attainments/${orgCode}`,
      limit: 10_000,
      handler: attainmentsHandler,
      queryParams: { personIds },
    })
  }
}
