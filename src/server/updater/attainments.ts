import { ThesisData } from '@backend/types'
import { Op } from 'sequelize'
import { Thesis, User } from '../db/models'
import { mangleData } from './mangleData'
import logger from '../util/logger'

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
          }
        )
      }
    })
  )
}

export const fetchThesesAttainments = async () => {
  const personIds = unfinishedTheses
    .map((thesis) => thesis.authors.map((author) => author.id))
    .flat()

  await mangleData({
    url: 'masters-attainments',
    limit: 10_000,
    handler: attainmentsHandler,
    queryParams: { personIds },
  })
}
