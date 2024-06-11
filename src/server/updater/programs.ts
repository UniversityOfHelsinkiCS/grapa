import { Program } from '../db/models'
import { getOrganisationData } from '../util/jami'
import { safeBulkCreate } from './util'

export const fetchPrograms = async () => {
  const allOrgs = await getOrganisationData()
  const mathScienceDepartment = allOrgs.find((org: any) => org.code === 'H50')

  const programs = mathScienceDepartment.programmes
    .filter((program: any) => program.level === 'master')
    .map((program: any) => ({
      ...program,
      id: program.key,
      enabled: false,
    }))

  await safeBulkCreate({
    entityName: 'Program',
    entities: programs,
    bulkCreate: async (e, opt) => Program.bulkCreate(e, opt),
    fallbackCreate: async (e, opt) => Program.upsert(e, opt),
    options: {
      updateOnDuplicate: [
        'name',
        'level',
        'international',
        'companionFaculties',
      ],
    },
  })
}
